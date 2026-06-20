import type { ParsedCompilerError } from "./types";

const ERROR_LINE =
  /(?:^|\n)(?:.*?\\)?([^(\n]+\.cs)\((\d+),(\d+)\):\s*error\s+(CS\d+|NU\d+|MSB\d+):\s*(.+)/gi;

const SIMPLE_ERROR = /error\s+(CS\d+|NU\d+|MSB\d+):\s*(.+)/gi;

const RESTORE_ERROR = /(?:error|ERROR)\s+(NU\d+|MSB\d+):\s*(.+)/gi;

export function parseCompilerOutput(output: string): ParsedCompilerError[] {
  const errors: ParsedCompilerError[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  ERROR_LINE.lastIndex = 0;
  while ((match = ERROR_LINE.exec(output)) !== null) {
    const key = `${match[4]}:${match[5]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    errors.push({
      file: match[1].trim().replace(/^.*[\\/]/, ""),
      line: Number(match[2]),
      code: match[4],
      message: match[5].trim(),
      raw: match[0].trim(),
    });
  }

  if (errors.length === 0) {
    SIMPLE_ERROR.lastIndex = 0;
    while ((match = SIMPLE_ERROR.exec(output)) !== null) {
      const key = `${match[1]}:${match[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      errors.push({
        code: match[1],
        message: match[2].trim(),
        raw: match[0].trim(),
      });
    }
  }

  if (errors.length === 0) {
    RESTORE_ERROR.lastIndex = 0;
    while ((match = RESTORE_ERROR.exec(output)) !== null) {
      const key = `${match[1]}:${match[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      errors.push({
        code: match[1],
        message: match[2].trim(),
        raw: match[0].trim(),
      });
    }
  }

  return errors;
}

export function inferMissingUsings(message: string): string[] {
  const lower = message.toLowerCase();
  const usings: string[] = [];

  if (/task|async|await/.test(lower)) {
    usings.push("using System.Threading.Tasks;");
  }
  if (/cancellationtoken|threading/.test(lower)) {
    usings.push("using System.Threading;");
  }
  if (/list<|ienumerable|icollection|dictionary|hashset|ireadonlylist/.test(lower)) {
    usings.push("using System.Collections.Generic;");
  }
  if (/datetime|guid|exception|console|math/.test(lower) && !/namespace/.test(lower)) {
    usings.push("using System;");
  }
  if (
    /actionresult|controllerbase|frombody|httppost|httpget|httpput|httpdelete|iapicontroller|okobjectresult|notfoundresult|createdatactionresult/.test(
      lower
    )
  ) {
    usings.push("using Microsoft.AspNetCore.Mvc;");
  }
  if (/mock<|it\.|mock\.setup/.test(lower)) {
    usings.push("using Moq;");
  }
  if (/fact|theory|xunit|assert\./.test(lower)) {
    usings.push("using Xunit;");
  }
  if (/dbcontext|entityframeworkcore|dbset|migrationbuilder/.test(lower)) {
    usings.push("using Microsoft.EntityFrameworkCore;");
  }
  if (/migration\]|migration\(/.test(lower)) {
    usings.push("using Microsoft.EntityFrameworkCore.Migrations;");
  }
  if (/entitytypeconfiguration|entitytypebuilder|modelbuilder/.test(lower)) {
    usings.push("using Microsoft.EntityFrameworkCore.Metadata.Builders;");
  }

  return usings;
}
