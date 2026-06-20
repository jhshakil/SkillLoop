import { UserRole, CourseStatus, CourseType, VideoStatus, QuestionStatus, EnrollmentStatus } from "@prisma/client";

export type { UserRole, CourseStatus, CourseType, VideoStatus, QuestionStatus, EnrollmentStatus };

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWithModules {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: CourseStatus;
  type: CourseType;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  creator: UserProfile;
  modules: ModuleWithVideos[];
  _count?: {
    enrollments: number;
    modules: number;
  };
}

export interface ModuleWithVideos {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  videos: VideoWithCount[];
  _count?: {
    videos: number;
  };
}

export interface VideoWithCount {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string | null;
  status: VideoStatus;
  order: number;
  moduleId: string;
  commentsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  module?: {
    title: string;
    courseId: string;
    course?: {
      id: string;
      title: string;
    };
  };
  _count?: {
    comments: number;
    notes: number;
    mcqQuestions: number;
  };
  mcqQuestions?: MCQQuestion[];
}

export interface CommentWithReplies {
  id: string;
  content: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: UserProfile;
  replies: CommentWithReplies[];
  _count?: {
    replies: number;
  };
}

export interface NoteWithVideo {
  id: string;
  content: string;
  userId: string;
  videoId: string;
  createdAt: Date;
  updatedAt: Date;
  video: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  status: QuestionStatus;
  videoId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  video?: {
    id: string;
    title: string;
  };
}

export interface MCQSubmission {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  createdAt: Date;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  userId: string;
  createdAt: Date;
}

export interface AdminActivityItem {
  id: string;
  action: string;
  details: string | null;
  adminId: string;
  targetId: string | null;
  createdAt: Date;
  admin: UserProfile;
}

export interface ModeratorActivityItem {
  id: string;
  action: string;
  details: string | null;
  moderatorId: string;
  targetId: string | null;
  createdAt: Date;
  moderator: UserProfile;
}

export interface EnrollmentItem {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
  user: UserProfile;
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
}

export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalCourses: number;
  totalUsers: number;
  totalEnrollments: number;
  totalVideos: number;
  recentlyJoined: UserProfile[];
  recentActivities: AdminActivityItem[];
}
