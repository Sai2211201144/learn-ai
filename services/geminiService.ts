import { GoogleGenAI, Type } from "@google/genai";
import type { Course, Flashcard, Lesson, KnowledgeLevel, ContentBlock, PracticeProblem, ChatMessage, QuizData, TestResult, Recommendation, Project, RelatedTopic } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizSchema = {
    type: Type.OBJECT,
    description: "Data for a single quiz question.",
    properties: {
        q: { type: Type.STRING, description: "The quiz question." },
        options: {
            type: Type.ARRAY,
            description: "An array of 2 to 4 possible answers.",
            items: { type: Type.STRING }
        },
        answer: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the 'options' array." }
    },
    required: ['q', 'options', 'answer']
};

const interactiveModelSchema = {
    type: Type.OBJECT,
    description: "Data for 'interactive_model' blocks.",
    properties: {
        title: { type: Type.STRING, description: "The title of the interactive model playground." },
        description: { type: Type.STRING, description: "A brief explanation of what the model demonstrates." },
        layers: {
            type: Type.ARRAY,
            description: "The layers of the neural network.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['input', 'hidden', 'output'], description: "The type of the layer." },
                    neurons: { type: Type.INTEGER, description: "Number of neurons in the layer." },
                    activation: { type: Type.STRING, enum: ['relu', 'sigmoid', 'tanh'], description: "Activation function for hidden layers." }
                },
                required: ['type', 'neurons']
            }
        },
        sampleInput: {
            type: Type.ARRAY,
            description: "An example input array for the model.",
            items: { type: Type.NUMBER }
        },
        expectedOutput: {
            type: Type.ARRAY,
            description: "The expected output for the sample input.",
            items: { type: Type.NUMBER }
        }
    },
    required: ['title', 'description', 'layers', 'sampleInput', 'expectedOutput']
};

const hyperparameterSchema = {
    type: Type.OBJECT,
    description: "Data for 'hyperparameter_simulator' blocks.",
    properties: {
        title: { type: Type.STRING, description: "The title of the hyperparameter simulator." },
        description: { type: Type.STRING, description: "A brief explanation of what the simulation demonstrates." },
        parameters: {
            type: Type.ARRAY,
            description: "The hyperparameters that can be tuned.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, enum: ['Learning Rate', 'Batch Size', 'Dropout'], description: "The name of the hyperparameter." },
                    options: {
                        type: Type.ARRAY,
                        description: "A list of 2-4 possible settings for the parameter.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING, description: "The display label for the option (e.g., 'Low', '0.01')." },
                                description: { type: Type.STRING, description: "A short explanation of this option's effect." }
                            },
                            required: ['label', 'description']
                        }
                    }
                },
                required: ['name', 'options']
            }
        },
        outcomes: {
            type: Type.ARRAY,
            description: "An array of outcomes, where each item links a parameter combination to its resulting loss curves and analysis.",
            items: {
                type: Type.OBJECT,
                properties: {
                    combination: {
                        type: Type.STRING,
                        description: "A hyphen-separated string of indices corresponding to the selected parameter options (e.g., '0-1-0')."
                    },
                    result: {
                        type: Type.OBJECT,
                        properties: {
                             trainingLoss: {
                                type: Type.ARRAY,
                                description: "An array of 20 numbers representing training loss over epochs.",
                                items: { type: Type.NUMBER }
                            },
                            validationLoss: {
                                type: Type.ARRAY,
                                description: "An array of 20 numbers representing validation loss over epochs.",
                                items: { type: Type.NUMBER }
                            },
                            description: { type: Type.STRING, description: "An explanation of why this outcome occurred." }
                        },
                        required: ['trainingLoss', 'validationLoss', 'description']
                    }
                },
                required: ['combination', 'result']
            }
        }
    },
    required: ['title', 'description', 'parameters', 'outcomes']
};

const triageChallengeSchema = {
    type: Type.OBJECT,
    description: "Data for a 'triage_challenge' block. This is an advanced quiz format.",
    properties: {
        scenario: { type: Type.STRING, description: "A description of a realistic problem or scenario, e.g., 'Your model is overfitting'." },
        evidence: { type: Type.STRING, description: "A Mermaid.js diagram string that provides visual evidence for the scenario (e.g., a line chart showing training and validation loss)." },
        options: {
            type: Type.ARRAY,
            description: "An array of 3-4 possible solutions or actions to take.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A short title for the option (e.g., 'Add Dropout')." },
                    description: { type: Type.STRING, description: "A brief description of what this action entails." },
                },
                required: ['title', 'description']
            }
        },
        correctOptionIndex: { type: Type.INTEGER, description: "The 0-based index of the correct option in the 'options' array." },
        explanation: { type: Type.STRING, description: "A detailed explanation of why the correct option is the best choice and why the others are less suitable." }
    },
    required: ['scenario', 'evidence', 'options', 'correctOptionIndex', 'explanation']
};

const courseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The overall title of the course, based on the user's topic." },
        description: { type: Type.STRING, description: "A short, engaging description of what the course covers." },
        modules: {
            type: Type.ARRAY,
            description: "An array of distinct course modules that logically break down the topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of this specific module." },
                    lessons: {
                        type: Type.ARRAY,
                        description: "An array of distinct lessons within this module.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "The title of this specific lesson." },
                                objective: { type: Type.STRING, description: "A one-sentence learning objective for this lesson." },
                                contentBlocks: {
                                    type: Type.ARRAY,
                                    description: "An array of content blocks to teach the lesson.",
                                    items: {
                                        type: Type.OBJECT,
                                        description: "A single block of content for a lesson. Based on the 'type', populate exactly ONE of the corresponding data fields (e.g., if type is 'text', populate the 'text' field).",
                                        properties: {
                                            type: {
                                                type: Type.STRING,
                                                enum: ['text', 'code', 'quiz', 'diagram', 'interactive_model', 'hyperparameter_simulator', 'triage_challenge']
                                            },
                                            text: {
                                                type: Type.STRING,
                                                description: "Content for a 'text' block. Used for explanations and paragraphs."
                                            },
                                            code: {
                                                type: Type.STRING,
                                                description: "Content for a 'code' block. Provide a block of code relevant to the lesson."
                                            },
                                            diagram: {
                                                type: Type.STRING,
                                                description: "Content for a 'diagram' block. Must be valid Mermaid JS syntax."
                                            },
                                            quiz: quizSchema,
                                            interactiveModel: interactiveModelSchema,
                                            hyperparameterSimulator: hyperparameterSchema,
                                            triageChallenge: triageChallengeSchema,
                                        },
                                        required: ['type']
                                    }
                                },
                                resources: {
                                    type: Type.ARRAY,
                                    description: "A list of 1-2 recommended external resources for this lesson.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING, enum: ['video', 'documentation', 'article'], description: "The type of resource." },
                                            title: { type: Type.STRING, description: "The title of the resource link." },
                                            url: { type: Type.STRING, description: "The full URL to the resource." }
                                        },
                                        required: ['type', 'title', 'url']
                                    }
                                },
                                practiceProblems: {
                                    type: Type.ARRAY,
                                    description: "For technical topics, a list of 1-3 relevant practice problems from platforms like LeetCode or GeeksforGeeks.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            platform: { type: Type.STRING, enum: ['leetcode', 'geeksforgeeks'], description: "The platform the problem is from." },
                                            title: { type: Type.STRING, description: "The title of the practice problem." },
                                            url: { type: Type.STRING, description: "The full URL to the practice problem." }
                                        },
                                        required: ['platform', 'title', 'url']
                                    }
                                }
                            },
                            required: ['title', 'objective', 'contentBlocks', 'resources']
                        }
                    }
                },
                required: ['title', 'lessons']
            }
        }
    },
    required: ['title', 'description', 'modules']
};

const flashcardSchema = {
    type: Type.ARRAY,
    description: "An array of flashcards, each with a question and an answer.",
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING, description: "The question for the front of the flashcard." },
            answer: { type: Type.STRING, description: "The answer for the back of the flashcard." },
        },
        required: ['question', 'answer'],
    }
};

const funFactsSchema = {
    type: Type.ARRAY,
    description: "An array of 3-5 short, fun facts or tips about a given topic.",
    items: {
        type: Type.STRING,
        description: "A single fun fact or tip."
    }
};

const assessmentQuizSchema = {
    type: Type.ARRAY,
    description: "An array of quiz questions for an assessment.",
    items: quizSchema
};

const recommendationsSchema = {
    type: Type.ARRAY,
    description: "An array of 2-3 recommended sub-topics for the user to study next.",
    items: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: "The specific, granular topic to recommend for a course (e.g., 'React Hooks' or 'Python List Comprehensions')." },
            reason: { type: Type.STRING, description: "A brief, one-sentence explanation for why this topic is being recommended based on their test performance." },
        },
        required: ['topic', 'reason'],
    }
};

const relatedTopicsSchema = {
    type: Type.ARRAY,
    description: "An array of 3-4 related topics for the user to explore next.",
    items: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: "The specific, related topic to suggest (e.g., 'Redux Toolkit' if the current topic is 'React')." },
            reason: { type: Type.STRING, description: "A brief, one-sentence explanation for why this topic is a good next step." },
        },
        required: ['topic', 'reason'],
    }
};

const projectSchema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING, description: "The user-provided topic for the project." },
        title: { type: Type.STRING, description: "An engaging title for this guided project." },
        description: { type: Type.STRING, description: "A short paragraph describing the project's goal and what the user will build." },
        steps: {
            type: Type.ARRAY,
            description: "An array of 4-7 logical steps to build the project.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of this specific project step." },
                    description: { type: Type.STRING, description: "A detailed explanation of the concept for this step." },
                    codeStub: { type: Type.STRING, description: "A block of boilerplate or starting code for this step." },
                    challenge: { type: Type.STRING, description: "A clear, actionable challenge or task for the user to complete in this step." }
                },
                required: ['title', 'description', 'codeStub', 'challenge']
            }
        }
    },
    required: ['topic', 'title', 'description', 'steps']
};


const callGemini = async (prompt: string, schema?: object) => {
    try {
        const config = schema ? {
            responseMimeType: "application/json",
            responseSchema: schema,
        } : {};

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: config,
        });

        const text = response.text.trim();
        
        if (schema) {
            const cleanedJsonString = text.replace(/^```json\s*|```$/g, '');
            return JSON.parse(cleanedJsonString);
        }
        return text;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's response. The format was invalid.");
        }
        if (error instanceof Error && error.message.includes('INVALID_ARGUMENT')) {
             throw new Error("Request contains an invalid argument. This might be due to an overly complex schema for the AI to follow.");
        }
        throw new Error("The AI model failed to generate content.");
    }
}


export const generateCourse = async (topic: string, knowledgeLevel: KnowledgeLevel): Promise<Course> => {
    const prompt = `Create a comprehensive course about "${topic}". The course should be structured for a learner with a '${knowledgeLevel}' level of prior knowledge. Adjust the complexity, depth, and examples accordingly. Generate a logical number of modules and lessons to provide a clear and complete understanding. A typical module might have between 3 and 7 lessons. Each lesson should include a mix of content types. For each content block, populate ONLY ONE of the data fields ('text', 'code', 'quiz', 'diagram', 'interactiveModel', 'hyperparameterSimulator') that corresponds to the 'type' field. For example, a text block should be '{"type": "text", "text": "..."}'. A quiz block should be '{"type": "quiz", "quiz": {...}}'. Where concepts can be better explained visually, include insightful diagrams, tables, or charts by providing a 'diagram' content block with valid Mermaid.js syntax. For example, use flowcharts for processes, pie charts for distributions, or simple tables. For lessons explaining the fundamental structure of neural networks, generate an 'interactiveModel' content block. For lessons on model training, optimization, or preventing overfitting, include a 'hyperparameterSimulator' block. For lessons focused on debugging or troubleshooting common issues (e.g., machine learning model problems), generate a 'triage_challenge' block. This should present a realistic scenario (like a model overfitting), provide a Mermaid.js diagram as evidence (like loss curves), and offer several plausible solutions as options. Also include plain text for explanations, code snippets where relevant, and a simple multiple-choice quiz to check understanding. For each lesson, also provide a list of 1-2 high-quality, real-world external resources. For lessons on technical topics (like algorithms, data structures), please also provide a list of 1-3 relevant practice problems from popular coding platforms like LeetCode or GeeksforGeeks. Ensure the links are correct and specific to the lesson's topic.`;

    const courseData = await callGemini(prompt, courseSchema);
            
    if (!courseData.title || !courseData.modules || courseData.modules.length === 0) {
        throw new Error("Received malformed course data from API.");
    }
    
    // Add unique IDs for persistence
    const courseWithIds: Course = {
        ...courseData,
        id: `course_${Date.now()}`,
        knowledgeLevel,
        modules: courseData.modules.map((module: any, moduleIndex: number) => ({
            ...module,
            lessons: module.lessons.map((lesson: any, lessonIndex: number) => ({
                ...lesson,
                id: `lesson_${moduleIndex}-${lessonIndex}_${Date.now()}`,
                contentBlocks: lesson.contentBlocks.map((block: ContentBlock, blockIndex: number) => ({
                    ...block,
                    id: `block_${moduleIndex}-${lessonIndex}-${blockIndex}_${Date.now()}`
                }))
            }))
        }))
    };

    return courseWithIds;
};

export const generateLessonFlashcards = async (lesson: Lesson): Promise<Flashcard[]> => {
    const prompt = `Based on the following lesson content, generate a concise set of 5-8 flashcards in a question-and-answer format. The questions should test the key concepts from this specific lesson. The answers should be clear and brief. Here is the lesson JSON: ${JSON.stringify(lesson, null, 2)}`;

    const flashcardData: Flashcard[] = await callGemini(prompt, flashcardSchema);
    
    if (!Array.isArray(flashcardData)) {
        throw new Error("Received malformed flashcard data from API. Expected an array of flashcards.");
    }

    return flashcardData;
};

export const continueSocraticDialogue = async (originalText: string, history: ChatMessage[]): Promise<string> => {
    const formattedHistory = history.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `You are an expert Socratic tutor. Your goal is to help a student understand a concept by asking them guiding questions, not by giving direct answers.
The student is studying this original text: "${originalText}".

Here is your conversation so far:
${formattedHistory}

Your task is to respond to the student's last message. 
- If the student seems confused or asks for clarification, ask simple, targeted questions to help them break down the problem (e.g., "What do you think that specific word means?", "Can you explain that part in your own words?").
- If they are on the right track, ask a more thought-provoking, open-ended question to guide them to the next step. 
- Your goal is to make them think critically and arrive at the answer themselves. Keep your response conversational and concise. Ask only one question at a time.`;

    const response = await callGemini(prompt);

    if (typeof response !== 'string') {
        throw new Error("Failed to get a valid response from the API.");
    }

    return response;
};

export const explainCodeSnippet = async (snippet: string, context: string): Promise<string> => {
    const prompt = `You are an expert programming tutor who is excellent at explaining complex topics simply. A student has highlighted a piece of code and wants to understand it better.

Here is the full code context:
\`\`\`
${context}
\`\`\`

Here is the specific snippet the student highlighted:
\`\`\`
${snippet}
\`\`\`

Please provide a concise, easy-to-understand explanation of what the highlighted snippet does. Focus on the concept behind the code, not just a literal translation. Explain it as you would to a beginner. Avoid jargon where possible, or explain it if you must use it.`;

    const response = await callGemini(prompt);

    if (typeof response !== 'string') {
        throw new Error("Failed to get a valid explanation from the API.");
    }
    
    return response;
};

export const generateFunFacts = async (topic: string): Promise<string[]> => {
    const prompt = `Generate a list of 4 interesting, short, fun facts or quick tips about "${topic}". Each fact should be a single, concise sentence. The facts should be engaging for someone waiting for a course to be generated. Return them as a JSON array of strings.`;

    try {
        const funFactsData = await callGemini(prompt, funFactsSchema);

        if (!Array.isArray(funFactsData) || funFactsData.some(item => typeof item !== 'string')) {
            console.warn("Received malformed fun facts data from API.");
            return [];
        }

        return funFactsData;
    } catch (error) {
        console.error("Could not generate fun facts:", error);
        return []; // Return empty array on failure so UI doesn't break
    }
};

export const generateAssessmentQuiz = async (topic: string, difficulty: KnowledgeLevel, count: number): Promise<QuizData[]> => {
    const prompt = `Generate a ${count}-question multiple-choice quiz to assess a user's knowledge on the topic of "${topic}". The difficulty level should be '${difficulty}'. The questions should be practical and test core concepts. Each question must have 2-4 options and a single correct answer.`;

    const quizData = await callGemini(prompt, assessmentQuizSchema);
    if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("Received malformed quiz data from API.");
    }
    return quizData;
};

export const generateRecommendations = async (topic: string, results: TestResult[]): Promise<Recommendation[]> => {
    const prompt = `A user has taken several assessment tests for the topic "${topic}". Based on their performance history, identify their knowledge gaps and recommend 2-3 specific, granular sub-topics they should study next. For example, if the main topic is 'Python' and they fail an intermediate test, you might recommend 'Python Decorators' or 'Asynchronous Programming in Python'.

Here is their test history (most recent first):
${JSON.stringify(results, null, 2)}

Analyze their scores across different difficulty levels. If they do well on 'beginner' but poorly on 'intermediate', suggest foundational intermediate topics. If they struggle with 'advanced' topics, suggest specific advanced concepts they might be missing. Provide a brief, encouraging reason for each recommendation.`;
    
    const recommendations = await callGemini(prompt, recommendationsSchema);
    if (!Array.isArray(recommendations)) {
        throw new Error("Received malformed recommendation data from API.");
    }
    return recommendations;
};

export const generateProjectScaffold = async (topic: string): Promise<Project> => {
    const prompt = `You are a curriculum designer creating a guided project for a learning application. Your task is to generate a project scaffold for the topic: "${topic}".
The project should be broken down into 4-7 clear, manageable steps. Each step must have:
1.  A concise title.
2.  A detailed description explaining the concept or goal of that step.
3.  A 'codeStub' which provides boilerplate or starting code. This code should be complete enough to run but have a clear place for the user to add their solution.
4.  A 'challenge' which is a clear, actionable instruction for what the user needs to add or modify in the codeStub.

Example for a "React To-Do App" step:
- title: "State Management for To-Dos"
- description: "We will use React's 'useState' hook to manage the list of to-do items..."
- codeStub: "import React, { useState } from 'react';\n\nfunction ToDoApp() {\n  // Challenge: Initialize state for todos here\n\n  return (<div>...</div>);\n}"
- challenge: "Use the 'useState' hook to create a state variable called 'todos'. Initialize it with an empty array."

Generate a complete, practical project for the topic "${topic}".`;
    
    const projectData = await callGemini(prompt, projectSchema);
    if (!projectData.title || !projectData.steps || projectData.steps.length === 0) {
        throw new Error("Received malformed project data from API.");
    }
    
    // Add unique IDs for persistence
    const projectWithIds: Project = {
        ...projectData,
        id: `project_${Date.now()}`,
        steps: projectData.steps.map((step: any, index: number) => ({
            ...step,
            id: `step_${index}_${Date.now()}`
        }))
    };
    
    return projectWithIds;
};

export const generateAnalogy = async (concept: string): Promise<string> => {
    const prompt = `Explain the concept of "${concept}" using a simple, relatable analogy. Keep the explanation concise (2-3 sentences) and easy for a beginner to understand.`;
    
    const response = await callGemini(prompt);
    if (typeof response !== 'string') {
        throw new Error("Failed to get a valid analogy from the API.");
    }
    return response;
};

export const generateCodeSnippet = async (description: string, language: string): Promise<string> => {
    const prompt = `Generate a functional and concise code snippet in ${language} that satisfies the following request: "${description}".
The code should be complete and ready to use.
Do not include any explanations, comments that are not part of the code itself, or markdown formatting like \`\`\`${language.toLowerCase()} or \`\`\`.
Only return the raw code.`;
    
    const response = await callGemini(prompt);

    if (typeof response !== 'string') {
        throw new Error("Failed to get a valid code snippet from the API.");
    }
    
    // The prompt requests no markdown, but as a fallback, clean it.
    const cleanedCode = response.replace(/^```(?:\w+)?\s*|```$/g, '').trim();
    return cleanedCode;
};

export const generateTestFromCourse = async (course: Course): Promise<QuizData[]> => {
    const prompt = `Based on the content of this entire course on '${course.title}' at a '${course.knowledgeLevel}' level, generate a ${10}-question multiple-choice quiz that covers the key concepts. Each question must have 2-4 options and a single correct answer. Here is the course content: ${JSON.stringify(course.modules)}`;
    
    const quizData = await callGemini(prompt, assessmentQuizSchema);
    if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("Received malformed quiz data from API.");
    }
    return quizData;
};

export const generateRelatedTopics = async (course: Course): Promise<RelatedTopic[]> => {
    const prompt = `A user has just finished studying a course on "${course.title}". Based on this topic, suggest 3-4 related but distinct topics they might want to explore next to broaden their knowledge. For each suggestion, provide a concise, one-sentence reason explaining why it's a good next step.`;

    const relatedTopics = await callGemini(prompt, relatedTopicsSchema);
    if (!Array.isArray(relatedTopics)) {
        throw new Error("Received malformed related topics data from API.");
    }
    return relatedTopics;
};