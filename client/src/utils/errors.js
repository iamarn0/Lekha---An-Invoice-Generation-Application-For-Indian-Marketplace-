export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.normalizedMessage || error?.response?.data?.message || fallback;
}

export function fieldErrorsOf(error) {
  return error?.fieldErrors || {};
}
