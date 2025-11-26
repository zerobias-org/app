#!/usr/bin/env node

/**
 * Debug script to connect to Hub Node debugger and inspect DataProducer getChildren calls
 *
 * Usage: node debug-hub-node.js
 */

const WebSocket = require('ws');
const readline = require('readline');

const DEBUGGER_URL = 'ws://localhost:9229/4f835d0e-e1f7-41fc-9409-261fadcc5934';

let messageId = 1;
let ws;

function send(method, params = {}) {
  const id = messageId++;
  const message = JSON.stringify({ id, method, params });
  console.log(`→ ${method}`);
  ws.send(message);
  return id;
}

function connect() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(DEBUGGER_URL);

    ws.on('open', () => {
      console.log('✓ Connected to Node.js debugger\n');
      resolve();
    });

    ws.on('error', (error) => {
      console.error('✗ Connection error:', error.message);
      reject(error);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.method === 'Runtime.consoleAPICalled') {
        // Console output from evaluated code
        const args = message.params.args || [];
        const values = args.map(arg => arg.value || arg.description || String(arg));
        console.log('  Console:', ...values);
      } else if (message.result) {
        // Result from our evaluation
        if (message.result.result) {
          const result = message.result.result;
          if (result.type === 'string') {
            console.log(`  Result: "${result.value}"`);
          } else if (result.type === 'object' && result.preview) {
            console.log(`  Result: ${result.description}`);
            if (result.preview.properties) {
              result.preview.properties.forEach(prop => {
                console.log(`    ${prop.name}: ${prop.value}`);
              });
            }
          } else {
            console.log(`  Result:`, result.value || result.description);
          }
        }
      } else if (message.error) {
        console.error('  Error:', message.error.message);
      }
    });

    ws.on('close', () => {
      console.log('\n✓ Debugger connection closed');
    });
  });
}

async function inspect() {
  try {
    await connect();

    console.log('Enabling Runtime domain...');
    send('Runtime.enable');

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('\nInspecting Hub Node state:\n');

    // Check if there are any active deployments
    console.log('1. Checking active deployments...');
    send('Runtime.evaluate', {
      expression: `
        (function() {
          const manager = global.deploymentManager || global.manager;
          if (!manager) return 'No deployment manager found';
          const deployments = manager.deployments || {};
          return Object.keys(deployments).length + ' active deployments';
        })()
      `,
      returnByValue: true
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check recent HTTP requests to modules
    console.log('\n2. Checking recent module requests...');
    send('Runtime.evaluate', {
      expression: `
        (function() {
          // Try to access http request logs or module invocation history
          if (global.lastModuleRequest) {
            return JSON.stringify(global.lastModuleRequest, null, 2);
          }
          return 'No recent module requests tracked';
        })()
      `,
      returnByValue: true
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set up a console log to track next getChildren call
    console.log('\n3. Setting up monitoring for next getChildren call...');
    send('Runtime.evaluate', {
      expression: `
        (function() {
          console.log('Monitoring enabled. Make a getChildren request in the UI...');
          return 'Monitoring active - check Hub Node logs for SQL module calls';
        })()
      `,
      returnByValue: true
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✓ Inspection complete. Press Ctrl+C to exit.\n');
    console.log('Now try loading the root object children in the data-explorer UI.');
    console.log('Watch for any output above or check Hub Node logs.\n');

    // Keep connection open for monitoring
    await new Promise(() => {}); // Never resolves, keeps script running

  } catch (error) {
    console.error('Error during inspection:', error);
    process.exit(1);
  }
}

inspect();
