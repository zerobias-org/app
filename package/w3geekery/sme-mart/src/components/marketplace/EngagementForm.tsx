'use client';

import { useState } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';

const CATEGORIES = [
  'Assessors',
  'Advisors',
  'Agentic',
  'SecOps',
  'DevSecOps',
  'Data Services',
  'Training',
  'Engineering',
];

export interface EngagementFormValues {
  title: string;
  description: string;
  category: string;
  budgetType: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
}

interface EngagementFormProps {
  initialValues?: Partial<EngagementFormValues>;
  onValuesChange: (values: EngagementFormValues) => void;
  disabled?: boolean;
}

export function EngagementForm({ initialValues, onValuesChange, disabled }: EngagementFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [category, setCategory] = useState(initialValues?.category || '');
  const [budgetType, setBudgetType] = useState(initialValues?.budgetType || '');
  const [budgetMin, setBudgetMin] = useState(initialValues?.budgetMin || '');
  const [budgetMax, setBudgetMax] = useState(initialValues?.budgetMax || '');
  const [timeline, setTimeline] = useState(initialValues?.timeline || '');

  const emitChange = (overrides: Partial<EngagementFormValues> = {}) => {
    onValuesChange({
      title, description, category, budgetType, budgetMin, budgetMax, timeline,
      ...overrides,
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <TextField
          fullWidth
          label="Title"
          placeholder="e.g., SOC 2 Type II Audit Support"
          value={title}
          onChange={(e) => { setTitle(e.target.value); emitChange({ title: e.target.value }); }}
          required
          disabled={disabled}
        />
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={4}
          placeholder="Describe the work you need, requirements, expectations..."
          value={description}
          onChange={(e) => { setDescription(e.target.value); emitChange({ description: e.target.value }); }}
          disabled={disabled}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth required disabled={disabled}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => { setCategory(e.target.value); emitChange({ category: e.target.value }); }}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel>Budget Type</InputLabel>
          <Select
            value={budgetType}
            label="Budget Type"
            onChange={(e) => { setBudgetType(e.target.value); emitChange({ budgetType: e.target.value }); }}
          >
            <MenuItem value="">Not specified</MenuItem>
            <MenuItem value="fixed">Fixed Price</MenuItem>
            <MenuItem value="hourly">Hourly</MenuItem>
            <MenuItem value="negotiable">Negotiable</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {budgetType && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Budget Min"
              type="number"
              value={budgetMin}
              onChange={(e) => { setBudgetMin(e.target.value); emitChange({ budgetMin: e.target.value }); }}
              disabled={disabled}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Budget Max"
              type="number"
              value={budgetMax}
              onChange={(e) => { setBudgetMax(e.target.value); emitChange({ budgetMax: e.target.value }); }}
              disabled={disabled}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
            />
          </Grid>
        </>
      )}

      <Grid size={12}>
        <TextField
          fullWidth
          label="Timeline"
          placeholder="e.g., 4 weeks, ASAP, Q2 2026"
          value={timeline}
          onChange={(e) => { setTimeline(e.target.value); emitChange({ timeline: e.target.value }); }}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
}

export function isFormValid(values: EngagementFormValues): boolean {
  return !!(values.title.trim() && values.category);
}
