// src/api/mockData.ts

// Simulated delay to mimic network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  auth: {
    login: async (credentials: any) => {
      await delay(800);
      return { 
        id: 'user_1', 
        name: 'Islem Charaf Eddine', 
        email: credentials.email || 'islem@oosira.com',
        token: 'mock-jwt-token-abc-123',
        plan: 'pro'
      };
    },
    logout: async () => {
      await delay(300);
      return { success: true };
    },
    getProfile: async () => {
      await delay(500);
      return {
        id: 'user_1', 
        name: 'Islem Charaf Eddine', 
        email: 'islem@oosira.com',
        plan: 'pro'
      };
    }
  },
  cvs: {
    getAll: async () => {
      await delay(600);
      return [
        {
          id: '1',
          title: 'Software Engineer CV',
          jobTitle: 'Senior Full Stack Developer',
          lastEdited: new Date().toISOString(),
          completionPercent: 100,
          status: 'completed',
          templateName: 'Tech & IT',
          previewColor: '#0D1117'
        },
        {
          id: '2',
          title: 'Design Portfolio',
          jobTitle: 'UI/UX Designer',
          lastEdited: new Date(Date.now() - 86400000).toISOString(),
          completionPercent: 65,
          status: 'draft',
          templateName: 'Creatif',
          previewColor: '#ec4899'
        }
      ];
    },
    duplicate: async (id: string) => {
      await delay(400);
      return {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Copy of CV',
        jobTitle: 'Position',
        lastEdited: new Date().toISOString(),
        completionPercent: 0,
        status: 'draft',
        templateName: 'Classique Pro',
        previewColor: '#1B3A6B'
      };
    },
    delete: async (id: string) => {
      await delay(500);
      return { success: true, id };
    }
  }
};
