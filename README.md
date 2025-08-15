# Smart Document Summarizer & Trend Tracker

An AI-powered document analysis platform built with Next.js, Node.js, Express, MongoDB, and OpenAI. Upload documents, get intelligent summaries, track trends over time, and discover insights with semantic search.

## 🚀 Features

### Core Features
- **AI-Powered Summarization**: Get concise, intelligent summaries in short, medium, or detailed formats
- **Multi-format Support**: Upload PDFs, Word documents, text files, and images (with OCR)
- **Semantic Search**: Find documents by meaning, not just keywords
- **Document Comparison**: Compare documents side-by-side to identify differences and similarities
- **Trend Analysis**: Track topics and themes across documents over time
- **Real-time Processing**: Socket.io integration for live processing updates

### Advanced Features
- **Named Entity Recognition**: Extract people, organizations, locations, and other entities
- **Sentiment Analysis**: Understand the emotional tone of your documents
- **Topic Detection**: Automatically categorize and tag documents
- **Collaborative Workspaces**: Share documents and insights with team members
- **Analytics Dashboard**: Visualize document insights and trends
- **Subscription Management**: Free, Pro, and Enterprise tiers

## 🏗 Architecture

### Backend (Node.js + Express + MongoDB)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **File Processing**: Support for PDF, DOCX, TXT, and image files
- **AI Integration**: OpenAI API for summarization and embeddings
- **Real-time Updates**: Socket.io for processing status updates
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet, CORS, rate limiting, input validation

### Frontend (Next.js + React + TypeScript)
- **Modern UI**: Tailwind CSS with responsive design
- **State Management**: TanStack Query for server state
- **Form Handling**: React Hook Form with validation
- **Notifications**: React Hot Toast for user feedback
- **Authentication**: JWT token management
- **File Upload**: React Dropzone for drag-and-drop uploads

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- OpenAI API key

## 🛠 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-document-summarizer
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smart-documents

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
```

### 3. Frontend Setup
```bash
cd ../smart-document-app
npm install
```

### 4. Start the Applications

**Start MongoDB** (if running locally):
```bash
mongod
```

**Start Backend** (from backend directory):
```bash
npm run dev
```

**Start Frontend** (from smart-document-app directory):
```bash
npm run dev
```

## 🎯 Usage

### Getting Started
1. Open http://localhost:3000 in your browser
2. Create an account or sign in
3. Upload your first document
4. Wait for AI processing to complete
5. Explore summaries, trends, and insights

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Sign out

#### Documents
- `GET /api/documents` - List user documents
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

#### Analysis
- `POST /api/analysis/process/:documentId` - Process document with AI
- `POST /api/analysis/compare` - Compare two documents
- `GET /api/analysis/trends` - Get trending topics
- `GET /api/analysis/analytics` - Get user analytics

#### Users
- `GET /api/users/stats` - Get user statistics

## 🏢 Subscription Tiers

### Free Tier
- 10 documents per month
- 100 MB storage
- Basic summaries
- Standard support

### Pro Tier ($29/month)
- 1,000 documents per month
- 5 GB storage
- Advanced analysis
- Priority support
- Trend tracking

### Enterprise Tier ($99/month)
- 10,000 documents per month
- 50 GB storage
- Custom integrations
- Dedicated support
- Advanced analytics

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev        # Start with nodemon
npm run build      # Compile TypeScript
npm run type-check # Check types only
```

### Frontend Development
```bash
cd smart-document-app
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
```

### Database Models

#### User Model
- Authentication and profile data
- Subscription management
- Usage tracking
- Preferences

#### Document Model
- File metadata and content
- AI analysis results
- Processing status
- Version history

#### Topic Model
- Trend tracking
- Timeline data
- Popularity scoring

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd smart-document-app
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Start with: `npm start`

### Frontend Deployment
1. Update API URLs for production
2. Build the application: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

### Environment Variables for Production
- Set strong JWT secrets
- Use production MongoDB URI
- Configure proper CORS origins
- Set up SSL/TLS

## 📚 Technical Stack

### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **OpenAI API** - AI processing
- **JWT** - Authentication
- **Multer** - File uploads
- **Helmet** - Security
- **Bcrypt** - Password hashing

### Frontend Technologies
- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Headless UI** - Accessible components
- **Heroicons** - Icon library
- **React Hot Toast** - Notifications

### AI & Processing
- **OpenAI GPT-3.5/4** - Text summarization
- **OpenAI Embeddings** - Semantic search
- **PDF.js** - PDF processing
- **Mammoth.js** - Word document processing
- **Tesseract.js** - OCR for images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Ensure MongoDB is running
- Check connection string in .env
- Verify network access

**OpenAI API Errors**
- Verify API key is correct
- Check API usage limits
- Ensure sufficient credits

**File Upload Issues**
- Check file size limits
- Verify supported file types
- Ensure upload directory exists

**CORS Errors**
- Verify frontend URL in backend .env
- Check CORS configuration
- Ensure proper headers

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ using Next.js, Node.js, and OpenAI 