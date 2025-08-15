import mongoose, { Schema, Model } from 'mongoose';
import { ITopic, ITopicTimelineEntry } from '../types';

// Define interface for static methods
interface ITopicModel extends Model<ITopic> {
  findByUser(userId: string, activeOnly?: boolean): any;
}

/**
 * Topic timeline entry schema
 */
const topicTimelineEntrySchema = new Schema<ITopicTimelineEntry>({
  documentId: {
    type: String,
    required: true,
    ref: 'Document'
  },
  date: {
    type: Date,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  relevanceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  sentiment: {
    type: Number,
    required: true,
    min: -1,
    max: 1
  },
  keyQuotes: {
    type: [String],
    default: [],
    validate: {
      validator: function(quotes: string[]) {
        return quotes.length <= 10;
      },
      message: 'Cannot have more than 10 key quotes'
    }
  }
}, { _id: false });

/**
 * Topic schema definition
 */
const topicSchema = new Schema<ITopic>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  keywords: {
    type: [String],
    default: [],
    validate: {
      validator: function(keywords: string[]) {
        return keywords.length <= 20;
      },
      message: 'Cannot have more than 20 keywords'
    }
  },
  documentIds: {
    type: [String],
    default: [],
    ref: 'Document'
  },
  timeline: {
    type: [topicTimelineEntrySchema],
    default: []
  },
  trendData: {
    frequency: {
      type: Number,
      default: 0,
      min: 0
    },
    sentimentTrend: {
      type: [Number],
      default: []
    },
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Indexes for better query performance
 */
topicSchema.index({ userId: 1, name: 1 }, { unique: true });
topicSchema.index({ userId: 1, isActive: 1 });
topicSchema.index({ keywords: 1 });
topicSchema.index({ 'trendData.popularityScore': -1 });
topicSchema.index({ createdAt: -1 });

/**
 * Instance method to add timeline entry
 */
topicSchema.methods.addTimelineEntry = function(entry: ITopicTimelineEntry) {
  this.timeline.push(entry);
  this.timeline.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
  
  // Update trend data
  this.trendData.frequency = this.timeline.length;
  this.trendData.sentimentTrend = this.timeline.slice(0, 10).map((t: any) => t.sentiment);
  
  // Calculate popularity score based on recent activity and sentiment
  const recentEntries = this.timeline.slice(0, 5);
  const avgSentiment = recentEntries.reduce((sum: number, t: any) => sum + t.sentiment, 0) / recentEntries.length;
  const activityScore = Math.min(this.timeline.length * 2, 50);
  const sentimentScore = (avgSentiment + 1) * 25; // Convert -1,1 to 0,50
  
  this.trendData.popularityScore = Math.round(activityScore + sentimentScore);
};

/**
 * Static method to find topics by user
 */
topicSchema.statics.findByUser = function(userId: string, activeOnly = true) {
  const query: any = { userId };
  if (activeOnly) query.isActive = true;
  
  return this.find(query).sort({ 'trendData.popularityScore': -1, updatedAt: -1 });
};

const Topic = mongoose.model<ITopic, ITopicModel>('Topic', topicSchema);
export default Topic; 