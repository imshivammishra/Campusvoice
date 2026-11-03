import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const AUTHORITY_ROLES = [
  'SUPER_ADMIN',
  'CHAIRMAN',
  'VICE_CHAIRMAN',
  'PRO_VICE_CHANCELLOR',
  'REGISTRAR',
  'PRINCIPAL',
  'HOD',
];

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Institution') private institutionModel: Model<any>,
    @InjectModel('Department') private departmentModel: Model<any>,
    @InjectModel('ClassEntity') private classModel: Model<any>,
    @InjectModel('CRElection') private electionModel: Model<any>,
    @InjectModel('Proposal') private proposalModel: Model<any>,
    @InjectModel('RegistrationApproval')
    private registrationModel: Model<any>,
  ) {}

  async getSystemStats() {
    const [
      users,
      activeUsers,
      students,
      teachers,
      authorities,
      pendingRegistrations,
      institutions,
      departments,
      classes,
      elections,
      activeElections,
      proposals,
    ] = await Promise.all([
      this.userModel.countDocuments({}),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ role: 'STUDENT' }),
      this.userModel.countDocuments({ role: 'TEACHER' }),
      this.userModel.countDocuments({ role: { $in: AUTHORITY_ROLES } }),
      this.registrationModel.countDocuments({ status: 'pending' }),
      this.institutionModel.countDocuments({}),
      this.departmentModel.countDocuments({}),
      this.classModel.countDocuments({}),
      this.electionModel.countDocuments({}),
      this.electionModel.countDocuments({
        status: { $in: ['active', 'nomination_open'] },
      }),
      this.proposalModel.countDocuments({}),
    ]);

    return {
      status: 'operational',
      users,
      activeUsers,
      inactiveUsers: users - activeUsers,
      students,
      teachers,
      authorities,
      pendingRegistrations,
      institutions,
      departments,
      classes,
      elections,
      activeElections,
      proposals,
    };
  }

  /**
   * Danger zone: wipe all platform content for a fresh start. Preserves
   * SUPER_ADMIN accounts (and therefore login) plus RBAC definitions.
   * Returns the number of documents removed per collection.
   */
  async purgeAllData() {
    const db = this.userModel.db;
    const collectionsToWipe = [
      'proposals',
      'crelections',
      'crcandidates',
      'crmessages',
      'supporttickets',
      'supportmessages',
      'notifications',
      'escalations',
      'resolutions',
      'managementreviews',
      'registrationapprovals',
      'auditevents',
      'votingauthorizations',
      'anonymousballots',
      'institutions',
      'departments',
      'classentities',
    ];

    const purged: Record<string, number> = {};
    for (const name of collectionsToWipe) {
      try {
        const r = await db.collection(name).deleteMany({});
        purged[name] = r.deletedCount || 0;
      } catch {
        purged[name] = 0;
      }
    }

    // Remove every user except super administrators.
    const u = await this.userModel.deleteMany({
      role: { $ne: 'SUPER_ADMIN' },
    });
    purged['users'] = u.deletedCount || 0;

    return { success: true, purged };
  }
}
