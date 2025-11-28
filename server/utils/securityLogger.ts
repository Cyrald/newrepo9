interface SecurityEvent {
  event: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, unknown>;
  timestamp: string;
}

export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  
  console.log(JSON.stringify(logEntry));
}

export function logLoginAttempt(params: {
  email: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  userId?: string;
  failureReason?: string;
}): void {
  logSecurityEvent({
    event: 'LOGIN_ATTEMPT',
    email: params.email,
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    success: params.success,
    details: params.failureReason ? { reason: params.failureReason } : undefined,
    timestamp: new Date().toISOString(),
  });
}

export function logRegistration(params: {
  email: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    event: 'USER_REGISTRATION',
    email: params.email,
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    success: true,
    timestamp: new Date().toISOString(),
  });
}

export function logPasswordChange(params: {
  userId: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
}): void {
  logSecurityEvent({
    event: 'PASSWORD_CHANGE',
    userId: params.userId,
    ip: params.ip,
    userAgent: params.userAgent,
    success: params.success,
    timestamp: new Date().toISOString(),
  });
}

export function logSessionInvalidation(params: {
  userId: string;
  ip?: string;
  reason: string;
}): void {
  logSecurityEvent({
    event: 'SESSION_INVALIDATED',
    userId: params.userId,
    ip: params.ip,
    success: true,
    details: { reason: params.reason },
    timestamp: new Date().toISOString(),
  });
}
