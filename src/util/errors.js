const Errors = {};

/**
 * Finds the message from within the error object.
 * @param {object} err The error object.
 * @returns {string} Error message, if found.
 */
//-----------------------------------------------------------------------------
Errors.handlePromptError = (err) => {
  try {
    return err.message;
  }
  catch(exp) {
    return 'UNKOWN ERROR';
  }
}
Errors.getMessage = err => {
  if(!err) {
    return '';
  }

  if(err.message) {
    return err.message;
  }

  if(err.errors) {
    return err.errors[0].message;
  }

  try {
    return JSON.stringify(err);
  }
  catch(exp) {
    return '';
  }
};

export default Errors;