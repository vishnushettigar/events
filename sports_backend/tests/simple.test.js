// Simple test to verify Jest is working
describe('Simple Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test string operations', () => {
    const message = 'Hello, World!';
    expect(message).toContain('Hello');
    expect(message.length).toBe(13);
  });

  it('should test array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
    expect(numbers[0]).toBe(1);
  });
});
