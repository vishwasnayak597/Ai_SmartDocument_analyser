import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

/**
 * User preferences schema
 */
const userPreferencesSchema = new Schema({
  defaultSummaryLength: {
    type: String,
    enum: ['short', 'medium', 'detailed'],
    default: 'medium'
  },
  autoProcessing: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  }
}, { _id: false });

/**
 * User schema definition with comprehensive validation
 */
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  subscription: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  documentsUploaded: {
    type: Number,
    default: 0,
    min: [0, 'Documents uploaded cannot be negative']
  },
  storageUsed: {
    type: Number,
    default: 0,
    min: [0, 'Storage used cannot be negative']
  },
  preferences: {
    type: userPreferencesSchema,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc: any, ret: any) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Index definitions for better query performance
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ subscription: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'preferences.theme': 1 });

/**
 * Pre-save middleware to hash password
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Pre-save middleware to update subscription expiry for free users
 */
userSchema.pre('save', function(next) {
  // Free users don't have expiry dates
  if (this.subscription === 'free') {
    this.subscriptionExpiry = undefined;
  }
  next();
});

/**
 * Instance method to compare password
 * @param candidatePassword - Password to compare
 * @returns Promise<boolean> - True if password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance method to get full name
 * @returns string - Full name of the user
 */
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

/**
 * Instance method to check if subscription is active
 * @returns boolean - True if subscription is active
 */
userSchema.methods.isSubscriptionActive = function(): boolean {
  if (this.subscription === 'free') return true;
  
  if (!this.subscriptionExpiry) return false;
  
  return new Date() < this.subscriptionExpiry;
};

/**
 * Instance method to get storage limit based on subscription
 * @returns number - Storage limit in bytes
 */
userSchema.methods.getStorageLimit = function(): number {
  const limits: { [key: string]: number } = {
    free: 100 * 1024 * 1024,      // 100 MB
    pro: 5 * 1024 * 1024 * 1024,  // 5 GB
    enterprise: 50 * 1024 * 1024 * 1024 // 50 GB
  };
  
  return limits[this.subscription] || limits.free;
};

/**
 * Instance method to get document limit based on subscription
 * @returns number - Document limit
 */
userSchema.methods.getDocumentLimit = function(): number {
  const limits: { [key: string]: number } = {
    free: 10,
    pro: 1000,
    enterprise: 10000
  };
  
  return limits[this.subscription] || limits.free;
};

/**
 * Instance method to check if user can upload more documents
 * @returns boolean - True if user can upload more documents
 */
userSchema.methods.canUploadMore = function(): boolean {
  return this.documentsUploaded < this.getDocumentLimit();
};

/**
 * Instance method to check if user has storage space
 * @param fileSize - Size of file to upload in bytes
 * @returns boolean - True if user has enough storage space
 */
userSchema.methods.hasStorageSpace = function(fileSize: number): boolean {
  return (this.storageUsed + fileSize) <= this.getStorageLimit();
};

/**
 * Static method to find user by email
 * @param email - Email address
 * @returns Promise<IUser | null> - User document or null
 */
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method to find users by subscription type
 * @param subscription - Subscription type
 * @returns Promise<IUser[]> - Array of user documents
 */
userSchema.statics.findBySubscription = function(subscription: string) {
  return this.find({ subscription });
};

/**
 * Static method to get user analytics
 * @returns Promise<any> - User analytics data
 */
userSchema.statics.getAnalytics = async function() {
  const analytics = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        freeUsers: { $sum: { $cond: [{ $eq: ['$subscription', 'free'] }, 1, 0] } },
        proUsers: { $sum: { $cond: [{ $eq: ['$subscription', 'pro'] }, 1, 0] } },
        enterpriseUsers: { $sum: { $cond: [{ $eq: ['$subscription', 'enterprise'] }, 1, 0] } },
        totalDocuments: { $sum: '$documentsUploaded' },
        totalStorage: { $sum: '$storageUsed' },
        avgDocumentsPerUser: { $avg: '$documentsUploaded' },
        avgStoragePerUser: { $avg: '$storageUsed' }
      }
    }
  ]);
  
  return analytics[0] || {};
};

/**
 * Virtual for getting storage usage percentage
 */
userSchema.virtual('storageUsagePercentage').get(function() {
  const limit = this.getStorageLimit();
  return limit > 0 ? (this.storageUsed / limit) * 100 : 0;
});

/**
 * Virtual for getting remaining document slots
 */
userSchema.virtual('remainingDocuments').get(function() {
  return Math.max(0, this.getDocumentLimit() - this.documentsUploaded);
});

/**
 * Virtual for getting remaining storage
 */
userSchema.virtual('remainingStorage').get(function() {
  return Math.max(0, this.getStorageLimit() - this.storageUsed);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

/**
 * Create and export the User model
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User; 