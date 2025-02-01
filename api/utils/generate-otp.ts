export default function generateOTP(length: number) {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
  
    const digits = [];
    for (let i = 0; i < length; i++) {
      const digit = randomBytes[i] % 10; // Extract the last digit
      if (digit >= 0 && digit <= 9) {
        digits.push(digit);
      }
    }
  
    if (digits.length < length) {
      // If not enough digits were extracted, try again
      return generateOTP(length);
    }
  
    return digits.join('');
  }