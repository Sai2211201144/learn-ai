export interface QuizData {
  q: string;
  options: string[];
  answer: number; // index of the correct option
}

export interface LayerData {
  type: 'input' | 'hidden' | 'output';
  neurons: number;
  activation?: 'relu' | 'sigmoid' | 'tanh';
}

export interface InteractiveModelData {
  title: string;
  description: string;
  layers: LayerData[];
  sampleInput: number[];
  expectedOutput: number[];
}

export interface Hyperparameter {
  name: 'Learning Rate' | 'Batch Size' | 'Dropout';
  options: {
    label: string; // e.g., 'Low', 'Medium', 'High' or '0.01'
    description: string;
  }[];
}

export interface Outcome {
  trainingLoss: number[];
  validationLoss: number[];
  description: string;
}

export interface OutcomeCombination {
  combination: string; // e.g., "0-1-0"
  result: Outcome;
}

export interface HyperparameterData {
  title: string;
  description: string;
  parameters: Hyperparameter[];
  outcomes: OutcomeCombination[];
}

export interface TriageChallengeData {
  scenario: string;
  evidence: string; // Mermaid diagram string
  options: {
    title: string;
    description: string;
  }[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'code' | 'quiz' | 'diagram' | 'interactive_model' | 'hyperparameter_simulator' | 'triage_challenge';
  // The generic 'data' field has been replaced by specific, optional fields
  // to create a more robust and less ambiguous schema for the Gemini API.
  text?: string;
  code?: string;
  diagram?: string;
  quiz?: QuizData;
  interactiveModel?: InteractiveModelData;
  hyperparameterSimulator?: HyperparameterData;
  triageChallenge?: TriageChallengeData;
}

export interface Resource {
  type: 'video' | 'documentation' | 'article';
  title: string;
  url: string;
}

export interface PracticeProblem {
  platform: 'leetcode' | 'geeksforgeeks';
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  objective: string;
  contentBlocks: ContentBlock[];
  resources: Resource[];
  practiceProblems?: PracticeProblem[];
  flashcards?: Flashcard[];
  notes?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id:string;
  title:string;
  description: string;
  modules: Module[];
  knowledgeLevel: KnowledgeLevel;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface Folder {
  id: string;
  name: string;
  courseIds: string[];
}

export interface ProjectStep {
    id: string;
    title: string;
    description: string;
    codeStub: string;
    challenge: string;
}

export interface Project {
    id: string;
    topic: string;
    title: string;
    description: string;
    steps: ProjectStep[];
}

// Progress is a map of completed lesson IDs to their completion timestamp.
export type Progress = Map<string, number>; 
export type ProjectProgress = Map<string, boolean>;
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface TestResult {
  id: string;
  topic: string;
  difficulty: KnowledgeLevel;
  score: number; // e.g., 0.8 for 80%
  questionCount: number;
  timestamp: number;
}

export interface Recommendation {
    topic: string;
    reason: string;
}

export interface RelatedTopic {
    topic: string;
    reason: string;
}