import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { Proposal } from '../models';

@Injectable({ providedIn: 'root' })
export class ProposalsService {
  private readonly db = inject(SmeMartDbService);

  async listProposalsByRequest(requestId: string): Promise<Proposal[]> {
    const result = await this.db.searchRows<Proposal>(
      'proposals',
      `(request_id=${requestId})`,
      { pageSize: 100 },
    );
    return result.items || [];
  }

  async getProposal(id: string): Promise<Proposal | null> {
    return this.db.getRow<Proposal>('proposals', id);
  }

  async submitProposal(data: {
    request_id: string;
    provider_id: string;
    cover_letter?: string;
    proposed_price?: string;
    proposed_timeline?: string;
  }): Promise<Proposal> {
    return this.db.createRow<Proposal>('proposals', {
      ...data,
      status: 'pending',
    });
  }

  async acceptProposal(id: string): Promise<Proposal> {
    return this.db.updateRow<Proposal>('proposals', id, { status: 'accepted' });
  }

  async rejectProposal(id: string): Promise<Proposal> {
    return this.db.updateRow<Proposal>('proposals', id, { status: 'rejected' });
  }

  async withdrawProposal(id: string): Promise<Proposal> {
    return this.db.updateRow<Proposal>('proposals', id, { status: 'withdrawn' });
  }
}
