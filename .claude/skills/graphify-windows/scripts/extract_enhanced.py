"""Enhanced AST extraction for unsupported languages (Verilog, SystemVerilog)."""
import sys, json, importlib
from pathlib import Path

import graphify.detect as dm
import graphify.extract as ex

dm.CODE_EXTENSIONS.update({'.v', '.sv', '.vhd', '.vhdl'})

EXT_TO_PARSER = {
    '.v': {
        'ts_module': 'tree_sitter_verilog',
        'ts_language_fn': 'language',
        'class_types': frozenset({'module_declaration'}),
        'function_types': frozenset({'always_construct', 'assign', 'initial_construct',
                                     'function_declaration', 'task_declaration'}),
        'import_types': frozenset(),
        'call_types': frozenset({'module_instantiation'}),
        'name_field': 'simple_identifier',
    },
    '.sv': {
        'ts_module': 'tree_sitter_verilog',
        'ts_language_fn': 'language',
        'class_types': frozenset({'module_declaration', 'class_declaration', 'interface_declaration'}),
        'function_types': frozenset({'always_construct', 'assign', 'initial_construct',
                                     'function_declaration', 'task_declaration'}),
        'import_types': frozenset(),
        'call_types': frozenset({'module_instantiation'}),
        'name_field': 'simple_identifier',
    },
}


def find_nodes(node, node_type):
    results = []
    if node.type == node_type:
        results.append(node)
    for child in node.children:
        results.extend(find_nodes(child, node_type))
    return results


def find_child_text(node, child_type, source_bytes):
    for child in node.children:
        if child.type == child_type:
            return source_bytes[child.start_byte:child.end_byte].decode('utf-8', errors='replace')
        result = find_child_text(child, child_type, source_bytes)
        if result is not None:
            return result
    return None


def extract_unsupported_file(fpath, config):
    try:
        mod = importlib.import_module(config['ts_module'])
    except ImportError:
        print(f'  WARNING: {config["ts_module"]} not installed')
        return {'nodes': [], 'edges': []}

    from tree_sitter import Language, Parser
    lang_fn = getattr(mod, config['ts_language_fn'], None)
    if not lang_fn:
        return {'nodes': [], 'edges': []}

    language = Language(lang_fn())
    parser = Parser(language)
    source_bytes = fpath.read_bytes()
    source_file = str(fpath)
    stem = fpath.stem
    tree = parser.parse(source_bytes)

    nodes = []
    edges = []

    for cls_type in config['class_types']:
        for cls_node in find_nodes(tree.root_node, cls_type):
            cls_name = find_child_text(cls_node, config['name_field'], source_bytes)
            if not cls_name:
                continue
            nodes.append({
                'id': cls_name, 'label': f'{cls_name} ({cls_type})',
                'file_type': 'code', 'source_file': source_file,
                'source_location': f'L{cls_node.start_point[0]+1}',
            })

    for func_type in config['function_types']:
        for func_node in find_nodes(tree.root_node, func_type):
            parent_mod = None
            for cls_type in config['class_types']:
                for cls_node in find_nodes(tree.root_node, cls_type):
                    if cls_node.start_byte <= func_node.start_byte <= cls_node.end_byte:
                        mod_name = find_child_text(cls_node, config['name_field'], source_bytes)
                        if mod_name:
                            parent_mod = mod_name
                            break
                if parent_mod:
                    break

            prefix = f'{parent_mod}_' if parent_mod else f'{stem}_'
            fid = f'{prefix}{func_type}_{func_node.start_point[0]}'
            nodes.append({
                'id': fid, 'label': f'{func_type} @{func_node.start_point[0]+1}',
                'file_type': 'code', 'source_file': source_file,
                'source_location': f'L{func_node.start_point[0]+1}',
            })
            if parent_mod:
                edges.append({
                    'source': parent_mod, 'target': fid,
                    'relation': 'contains', 'confidence': 'EXTRACTED',
                    'confidence_score': 1.0, 'source_file': source_file, 'weight': 1.0,
                })

    for call_type in config['call_types']:
        for call_node in find_nodes(tree.root_node, call_type):
            target_name = find_child_text(call_node, config['name_field'], source_bytes)
            inst_name = find_child_text(call_node, 'instance_identifier', source_bytes)
            if target_name:
                parent_mod = None
                for cls_type in config['class_types']:
                    for cls_node in find_nodes(tree.root_node, cls_type):
                        if cls_node.start_byte <= call_node.start_byte <= cls_node.end_byte:
                            mod_name = find_child_text(cls_node, config['name_field'], source_bytes)
                            if mod_name:
                                parent_mod = mod_name
                                break
                    if parent_mod:
                        break

                nid = f'{stem}_{target_name}_inst'
                label = f'{inst_name} ({target_name})' if inst_name else f'{target_name} inst'
                nodes.append({
                    'id': nid, 'label': label, 'file_type': 'code',
                    'source_file': source_file,
                    'source_location': f'L{call_node.start_point[0]+1}',
                })
                edges.append({
                    'source': nid, 'target': target_name,
                    'relation': 'instantiates', 'confidence': 'EXTRACTED',
                    'confidence_score': 1.0, 'source_file': source_file, 'weight': 1.0,
                })
                if parent_mod:
                    edges.append({
                        'source': parent_mod, 'target': nid,
                        'relation': 'contains', 'confidence': 'EXTRACTED',
                        'confidence_score': 1.0, 'source_file': source_file, 'weight': 1.0,
                    })

    return {'nodes': nodes, 'edges': edges}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('detect_json', help='Path to .graphify_detect.json')
    parser.add_argument('--output', '-o', default='.graphify_ast.json')
    args = parser.parse_args()

    detect = json.loads(Path(args.detect_json).read_text())
    all_code_files = []
    for f in detect.get('files', {}).get('code', []):
        p = Path(f)
        if p.is_dir():
            all_code_files.extend(sorted(p.rglob('*')))
        else:
            all_code_files.append(p)

    _BUILTIN_EXTS = {'.py','.js','.jsx','.ts','.tsx','.go','.rs','.java','.c','.h',
        '.cpp','.cc','.cxx','.hpp','.rb','.swift','.kt','.kts','.cs','.scala',
        '.php','.lua','.toc','.zig','.ps1','.ex','.exs','.m','.mm','.jl'}

    unsupported_files = [f for f in all_code_files if f.suffix.lower() not in _BUILTIN_EXTS]
    supported_files = [f for f in all_code_files if f.suffix.lower() in _BUILTIN_EXTS]

    all_nodes = []
    all_edges = []

    if supported_files:
        result = ex.extract(supported_files)
        all_nodes.extend(result.get('nodes', []))
        all_edges.extend(result.get('edges', []))
        print(f'Built-in AST: {len(result.get("nodes",[]))} nodes, {len(result.get("edges",[]))} edges')

    if unsupported_files:
        by_ext = {}
        for f in unsupported_files:
            by_ext.setdefault(f.suffix.lower(), []).append(f)
        for ext, files in sorted(by_ext.items()):
            config = EXT_TO_PARSER.get(ext)
            if not config:
                print(f'  WARNING: No parser for {ext} - skipping {len(files)} files')
                continue
            for f in files:
                result = extract_unsupported_file(f, config)
                all_nodes.extend(result['nodes'])
                all_edges.extend(result['edges'])
                print(f'  {f.name}: {len(result["nodes"])} nodes, {len(result["edges"])} edges')

    seen = {}
    deduped = []
    for n in all_nodes:
        if n['id'] not in seen:
            seen[n['id']] = True
            deduped.append(n)

    ast_result = {'nodes': deduped, 'edges': all_edges, 'input_tokens': 0, 'output_tokens': 0}
    Path(args.output).write_text(json.dumps(ast_result, indent=2), encoding='utf-8')
    print(f'Total AST: {len(deduped)} nodes, {len(all_edges)} edges')
