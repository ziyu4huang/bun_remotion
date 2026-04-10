// Grammar registry — maps file extensions to tree-sitter grammar configs

export interface GrammarConfig {
  wasm: string;
  classTypes: string[];
  functionTypes: string[];
  importTypes: string[];
  callTypes: string[];
  nameField: string;
  // For some languages, the import/resolve field differs
  importNameField?: string;
}

function caseFrom(ext: string): GrammarConfig {
  return REGISTRY[ext]!;
}

const REGISTRY: Record<string, GrammarConfig> = {
  // TypeScript
  '.ts': {
    wasm: 'tree-sitter-typescript.wasm',
    classTypes: ['class_declaration', 'interface_declaration', 'type_alias_declaration', 'enum_declaration'],
    functionTypes: ['function_declaration', 'method_definition', 'arrow_function', 'generator_function_declaration'],
    importTypes: ['import_statement', 'import_declaration', 'export_statement'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.tsx': {
    wasm: 'tree-sitter-tsx.wasm',
    classTypes: ['class_declaration', 'interface_declaration', 'type_alias_declaration', 'enum_declaration'],
    functionTypes: ['function_declaration', 'method_definition', 'arrow_function'],
    importTypes: ['import_statement', 'import_declaration', 'export_statement'],
    callTypes: ['call_expression', 'jsx_element'],
    nameField: 'identifier',
  },
  // JavaScript
  '.js': {
    wasm: 'tree-sitter-javascript.wasm',
    classTypes: ['class_declaration', 'class'],
    functionTypes: ['function_declaration', 'method_definition', 'arrow_function', 'generator_function_declaration'],
    importTypes: ['import_declaration', 'call_expression'],  // require() is a call_expression
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.jsx': {
    wasm: 'tree-sitter-javascript.wasm',
    classTypes: ['class_declaration', 'class'],
    functionTypes: ['function_declaration', 'method_definition', 'arrow_function'],
    importTypes: ['import_declaration'],
    callTypes: ['call_expression', 'jsx_element'],
    nameField: 'identifier',
  },
  // Python
  '.py': {
    wasm: 'tree-sitter-python.wasm',
    classTypes: ['class_definition'],
    functionTypes: ['function_definition', 'decorated_definition'],
    importTypes: ['import_statement', 'import_from_statement', 'future_import_statement'],
    callTypes: ['call'],
    nameField: 'identifier',
  },
  // Go
  '.go': {
    wasm: 'tree-sitter-go.wasm',
    classTypes: ['type_declaration', 'type_spec'],
    functionTypes: ['function_declaration', 'method_declaration'],
    importTypes: ['import_declaration'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  // Rust
  '.rs': {
    wasm: 'tree-sitter-rust.wasm',
    classTypes: ['struct_item', 'enum_item', 'trait_item'],
    functionTypes: ['function_item', 'impl_item', 'associated_function'],
    importTypes: ['use_declaration'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  // Java
  '.java': {
    wasm: 'tree-sitter-java.wasm',
    classTypes: ['class_declaration', 'interface_declaration', 'enum_declaration'],
    functionTypes: ['method_declaration', 'constructor_declaration'],
    importTypes: ['import_declaration'],
    callTypes: ['method_invocation'],
    nameField: 'identifier',
  },
  // C / C++
  '.c': {
    wasm: 'tree-sitter-c.wasm',
    classTypes: ['struct_specifier', 'enum_specifier', 'typedef_declaration'],
    functionTypes: ['function_definition', 'declaration'],
    importTypes: ['preproc_include'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.h': {
    wasm: 'tree-sitter-c.wasm',
    classTypes: ['struct_specifier', 'enum_specifier', 'typedef_declaration'],
    functionTypes: ['function_definition', 'declaration'],
    importTypes: ['preproc_include'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.cpp': {
    wasm: 'tree-sitter-cpp.wasm',
    classTypes: ['class_specifier', 'struct_specifier', 'enum_specifier'],
    functionTypes: ['function_definition', 'declaration'],
    importTypes: ['preproc_include'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.cc': null as unknown as GrammarConfig,  // alias for .cpp — resolved below
  '.cxx': null as unknown as GrammarConfig,
  '.hpp': null as unknown as GrammarConfig,
  // C#
  '.cs': {
    wasm: 'tree-sitter-c_sharp.wasm',
    classTypes: ['class_declaration', 'interface_declaration', 'struct_declaration', 'enum_declaration'],
    functionTypes: ['method_declaration', 'constructor_declaration'],
    importTypes: ['using_directive', 'namespace_declaration'],
    callTypes: ['invocation_expression'],
    nameField: 'identifier',
  },
  // Ruby
  '.rb': {
    wasm: 'tree-sitter-ruby.wasm',
    classTypes: ['class', 'module'],
    functionTypes: ['method', 'singleton_method'],
    importTypes: ['require'],
    callTypes: ['call', 'method_call'],
    nameField: 'identifier',
  },
  // Swift
  '.swift': {
    wasm: 'tree-sitter-swift.wasm',
    classTypes: ['class_declaration', 'struct_declaration', 'protocol_declaration', 'enum_declaration'],
    functionTypes: ['function_declaration'],
    importTypes: ['import_declaration'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  // Kotlin
  '.kt': {
    wasm: 'tree-sitter-kotlin.wasm',
    classTypes: ['class_declaration', 'object_declaration', 'interface_declaration'],
    functionTypes: ['function_declaration'],
    importTypes: ['import_statement'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.kts': null as unknown as GrammarConfig, // alias for .kt
  // PHP
  '.php': {
    wasm: 'tree-sitter-php.wasm',
    classTypes: ['class_declaration', 'interface_declaration', 'trait_declaration'],
    functionTypes: ['function_definition', 'method_declaration'],
    importTypes: ['use_statement', 'namespace_use_statement'],
    callTypes: ['function_call_expression', 'member_call_expression'],
    nameField: 'name',
  },
  // Lua
  '.lua': {
    wasm: 'tree-sitter-lua.wasm',
    classTypes: [],
    functionTypes: ['function_declaration', 'local_function'],
    importTypes: ['require'],
    callTypes: ['function_call'],
    nameField: 'identifier',
  },
  // Julia
  '.jl': {
    wasm: 'tree-sitter-julia.wasm',
    classTypes: ['struct_definition', 'abstract_definition', 'mutable_definition'],
    functionTypes: ['function_definition', 'short_function_definition'],
    importTypes: ['using_statement', 'import_statement', 'export_statement'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  // Scala
  '.scala': {
    wasm: 'tree-sitter-scala.wasm',
    classTypes: ['class_definition', 'object_definition', 'trait_definition'],
    functionTypes: ['function_definition'],
    importTypes: ['import_statement', 'import_declaration'],
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  // Zig
  '.zig': {
    wasm: 'tree-sitter-zig.wasm',
    classTypes: ['ContainerDecl'],
    functionTypes: ['FnDecl'],
    importTypes: ['BuiltinDeclExpr'],
    callTypes: ['BuiltinCallExpr'],
    nameField: 'identifier',
  },
  // Elixir
  '.ex': {
    wasm: 'tree-sitter-elixir.wasm',
    classTypes: ['module_definition'],
    functionTypes: ['function_definition', 'macro_definition'],
    importTypes: ['call_expression'], // require/use are calls in Elixir
    callTypes: ['call_expression'],
    nameField: 'identifier',
  },
  '.exs': null as unknown as GrammarConfig, // alias for .ex
  // Objective-C
  '.m': {
    wasm: 'tree-sitter-objc.wasm',
    classTypes: ['class_interface', 'class_implementation', 'protocol_declaration'],
    functionTypes: ['function_definition', 'method_definition'],
    importTypes: ['preproc_include', 'class_interface'],
    callTypes: ['message_expression', 'call_expression'],
    nameField: 'identifier',
  },
  '.mm': null as unknown as GrammarConfig, // alias for .m
  // PowerShell
  '.ps1': {
    wasm: 'tree-sitter-powershell.wasm',
    classTypes: ['class_definition', 'enum_definition'],
    functionTypes: ['function_definition', 'script_block'],
    importTypes: ['using_statement', 'import_statement'],
    callTypes: ['command', 'invocation_expression'],
    nameField: 'identifier',
  },
  // Verilog
  '.v': {
    wasm: 'tree-sitter-verilog.wasm',
    classTypes: ['module_declaration'],
    functionTypes: ['always_construct', 'assign', 'initial_construct', 'function_declaration', 'task_declaration'],
    importTypes: [],
    callTypes: ['module_instantiation'],
    nameField: 'simple_identifier',
  },
  '.sv': {
    wasm: 'tree-sitter-verilog.wasm',
    classTypes: ['module_declaration', 'class_declaration', 'interface_declaration'],
    functionTypes: ['always_construct', 'assign', 'initial_construct', 'function_declaration', 'task_declaration'],
    importTypes: [],
    callTypes: ['module_instantiation'],
    nameField: 'simple_identifier',
  },
  // WoW TOC files (Lua-like)
  '.toc': {
    wasm: 'tree-sitter-lua.wasm',
    classTypes: [],
    functionTypes: ['function_declaration', 'local_function'],
    importTypes: ['require'],
    callTypes: ['function_call'],
    nameField: 'identifier',
  },
};

// Resolve aliases (extensions that share a grammar with another extension)
const ALIASES: Record<string, string> = {
  '.cc': '.cpp', '.cxx': '.cpp', '.hpp': '.cpp',
  '.kts': '.kt', '.exs': '.ex', '.mm': '.m',
};

export function getGrammarConfig(ext: string): GrammarConfig | undefined {
  const lower = ext.toLowerCase();
  return REGISTRY[lower] || REGISTRY[ALIASES[lower] || ''];
}

export function getSupportedExtensions(): string[] {
  return Object.keys(REGISTRY);
}

export default REGISTRY;
