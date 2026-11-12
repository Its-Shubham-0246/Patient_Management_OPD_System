import mongoose, { Schema, Document } from 'mongoose';

export type ReportType = 'lab' | 'radiology' | 'pathology' | 'cardiology' | 'other';

export interface IMedicalReport extends Document {
  clinicId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  reportType: ReportType;
  reportName: string;
  title: string;
  reportDate: Date;
  fileUrl: string;
  filePublicId?: string;
  thumbnailUrl?: string;
  fileSizeBytes: number;
  mimeType: string;
  labName?: string;
  referringDoctor?: string;
  findings?: string;
  isSharedWithPatient: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  retentionUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalReportSchema = new Schema<IMedicalReport>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: {
      type: String,
      enum: ['lab', 'radiology', 'pathology', 'cardiology', 'other'],
      default: 'lab',
      index: true
    },
    reportName: { type: String, required: true },
    title: { type: String },
    reportDate: { type: Date, default: Date.now, index: true },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, default: 'local_storage' },
    thumbnailUrl: { type: String },
    fileSizeBytes: { type: Number, default: 102400 },
    mimeType: { type: String, default: 'application/pdf' },
    labName: { type: String },
    referringDoctor: { type: String },
    findings: { type: String },
    isSharedWithPatient: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    retentionUntil: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 7); // DISHA / DPDP 7-year statutory retention
        return d;
      }
    }
  },
  { timestamps: true }
);

MedicalReportSchema.pre('save', function (next) {
  if (!this.title) {
    this.title = this.reportName;
  }
  if (!this.reportName) {
    this.reportName = this.title;
  }
  next();
});

MedicalReportSchema.index({ clinicId: 1, patientId: 1, reportDate: -1 });
MedicalReportSchema.index({ clinicId: 1, isDeleted: 1 });

export const MedicalReport = mongoose.model<IMedicalReport>('MedicalReport', MedicalReportSchema);

