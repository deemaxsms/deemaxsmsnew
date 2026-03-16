import { UserSession, SMSNumber } from '../types/sms-types';

class SMSSessionService {
  private readonly SESSION_KEY = 'sms_globe_session';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Get current session from localStorage
  getSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as UserSession;
      
      // Check if session has expired
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);
      const timeDiff = now.getTime() - lastActivity.getTime();
      
      if (timeDiff > this.SESSION_TIMEOUT) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      this.clearSession();
      return null;
    }
  }

  // Save session to localStorage
  saveSession(session: UserSession): void {
    try {
      const sessionToSave = {
        ...session,
        lastActivity: new Date()
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionToSave));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Update session with new data
  updateSession(updates: Partial<UserSession>): UserSession | null {
    const currentSession = this.getSession();
    if (!currentSession) return null;

    const updatedSession = {
      ...currentSession,
      ...updates,
      lastActivity: new Date()
    };

    this.saveSession(updatedSession);
    return updatedSession;
  }

  // Clear session
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Initialize new session
  initializeSession(): UserSession {
    const newSession: UserSession = {
      activeNumbers: [],
      currentStep: 'service-selection',
      lastActivity: new Date()
    };

    this.saveSession(newSession);
    return newSession;
  }

  // Add active number to session
  addActiveNumber(number: SMSNumber): void {
    const session = this.getSession() || this.initializeSession();
    
    // Remove any existing number with same ID
    session.activeNumbers = session.activeNumbers.filter(n => n.id !== number.id);
    
    // Add new number
    session.activeNumbers.push(number);
    
    this.saveSession(session);
  }

  // Update active number in session
  updateActiveNumber(numberId: string, updates: Partial<SMSNumber>): void {
    const session = this.getSession();
    if (!session) return;

    const numberIndex = session.activeNumbers.findIndex(n => n.id === numberId);
    if (numberIndex === -1) return;

    session.activeNumbers[numberIndex] = {
      ...session.activeNumbers[numberIndex],
      ...updates
    };

    this.saveSession(session);
  }

  // Remove active number from session
  removeActiveNumber(numberId: string): void {
    const session = this.getSession();
    if (!session) return;

    session.activeNumbers = session.activeNumbers.filter(n => n.id !== numberId);
    this.saveSession(session);
  }

  // Get active numbers
  getActiveNumbers(): SMSNumber[] {
    const session = this.getSession();
    return session?.activeNumbers || [];
  }

  // Set current step
  setCurrentStep(step: UserSession['currentStep']): void {
    this.updateSession({ currentStep: step });
  }

  // Get current step
  getCurrentStep(): UserSession['currentStep'] {
    const session = this.getSession();
    return session?.currentStep || 'service-selection';
  }

  // Set selected service
  setSelectedService(service: string): void {
    this.updateSession({ 
      selectedService: service,
      currentStep: 'country-selection'
    });
  }

  // Set selected country
  setSelectedCountry(country: string): void {
    this.updateSession({ 
      selectedCountry: country,
      currentStep: 'number-type'
    });
  }

  // Set selected type and duration
  setSelectedType(type: 'one-time' | 'rental', duration?: number): void {
    this.updateSession({ 
      selectedType: type,
      selectedRentalDuration: duration,
      currentStep: 'payment'
    });
  }

  // Reset selection (start over)
  resetSelection(): void {
    this.updateSession({
      selectedService: undefined,
      selectedCountry: undefined,
      selectedType: undefined,
      selectedRentalDuration: undefined,
      currentStep: 'service-selection'
    });
  }

  // Check if session has active selections
  hasActiveSelection(): boolean {
    const session = this.getSession();
    return !!(session?.selectedService || session?.selectedCountry || session?.selectedType);
  }

  // Get session progress percentage
  getProgressPercentage(): number {
    const session = this.getSession();
    if (!session) return 0;

    const steps = ['service-selection', 'country-selection', 'number-type', 'payment', 'waiting', 'completed'];
    const currentStepIndex = steps.indexOf(session.currentStep);
    
    return Math.round((currentStepIndex / (steps.length - 1)) * 100);
  }

  // Auto-cleanup expired numbers
  cleanupExpiredNumbers(): void {
    const session = this.getSession();
    if (!session) return;

    const now = new Date();
    const activeNumbers = session.activeNumbers.filter(number => {
      const expiresAt = new Date(number.expiresAt);
      return expiresAt > now && number.status !== 'completed' && number.status !== 'cancelled';
    });

    if (activeNumbers.length !== session.activeNumbers.length) {
      session.activeNumbers = activeNumbers;
      this.saveSession(session);
    }
  }

  // Get session summary for display
  getSessionSummary(): {
    hasActiveNumbers: boolean;
    activeNumbersCount: number;
    currentStep: string;
    selectedService?: string;
    selectedCountry?: string;
    selectedType?: string;
    progressPercentage: number;
  } {
    const session = this.getSession();
    
    return {
      hasActiveNumbers: (session?.activeNumbers.length || 0) > 0,
      activeNumbersCount: session?.activeNumbers.length || 0,
      currentStep: session?.currentStep || 'service-selection',
      selectedService: session?.selectedService,
      selectedCountry: session?.selectedCountry,
      selectedType: session?.selectedType,
      progressPercentage: this.getProgressPercentage()
    };
  }
}

export const smsSessionService = new SMSSessionService();