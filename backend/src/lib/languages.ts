export const supportedLanguages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const DEFAULT_SESSION_CODE: Record<SupportedLanguage, string> = {
  javascript: "// Write your JavaScript code here",
  typescript: "// Write your TypeScript code here",
  python: "# Write your Python code here",
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

export function getDefaultSessionCode(language: SupportedLanguage) {
  return DEFAULT_SESSION_CODE[language];
}
