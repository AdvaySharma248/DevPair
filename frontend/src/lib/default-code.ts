export const EMPTY_CODE = '// Start coding here...';

export const DEFAULT_CODE: Record<string, string> = {
  javascript: '// Write your JavaScript code here',
  typescript: '// Write your TypeScript code here',
  python: '# Write your Python code here',
  java: `// Write your Java here
import java.util.*;

public class Main {
    public static void main(String[] args) {
        
    }
}`,
  cpp: `// Write your C++ here
#include <bits/stdc++.h>

using namespace std;

int main() {
    
    return 0;
}`,
};

export function getDefaultCode(language?: string) {
  if (!language) {
    return EMPTY_CODE;
  }

  return DEFAULT_CODE[language] || EMPTY_CODE;
}
