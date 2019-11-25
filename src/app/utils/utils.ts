export function isNumber(value: any): value is number {
    return typeof value === 'number';
  }
  
  export function isNumberFinite(value: any): value is number {
    return isNumber(value) && isFinite(value);
  }
  
  // Not strict positive
  export function isPositive(value: number): boolean {
    return value >= 0;
  }
  
  export function isInteger(value: number): boolean {
    // No rest, is an integer
    return value % 1 === 0;
  }

  export function toDecimal(value: number, decimal: number): number {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
  }