// Validation utility functions for authentication

// Email validation - must end with @gmail.com
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return {
    isValid: emailRegex.test(email),
    message: "Email must be a valid Gmail address (ending with @gmail.com)"
  };
};

// Strong password validation
export const validatePassword = (password) => {
  const errors = [];
  
  // Minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  // Must contain number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  // Must contain special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  // No common weak passwords
  const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common, please choose a stronger password");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    message: errors.length > 0 ? errors.join(". ") : "Password is strong"
  };
};

// Name validation
export const validateName = (name) => {
  if (!name.trim()) {
    return {
      isValid: false,
      message: "Name is required"
    };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: "Name must be at least 2 characters long"
    };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return {
      isValid: false,
      message: "Name can only contain letters and spaces"
    };
  }
  
  return {
    isValid: true,
    message: "Name is valid"
  };
};

// Circle name validation
export const validateCircleName = (circleName) => {
  if (!circleName.trim()) {
    return {
      isValid: false,
      message: "Circle name is required"
    };
  }
  
  if (circleName.trim().length < 3) {
    return {
      isValid: false,
      message: "Circle name must be at least 3 characters long"
    };
  }
  
  return {
    isValid: true,
    message: "Circle name is valid"
  };
};

// Invite code validation
export const validateInviteCode = (inviteCode) => {
  if (!inviteCode.trim()) {
    return {
      isValid: false,
      message: "Invite code is required"
    };
  }
  
  if (inviteCode.trim().length < 6) {
    return {
      isValid: false,
      message: "Invite code must be at least 6 characters long"
    };
  }
  
  return {
    isValid: true,
    message: "Invite code is valid"
  };
};
