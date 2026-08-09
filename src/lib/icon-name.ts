// Category icons are stored as Material Symbols identifiers (snake_case, e.g. "directions_car"),
// but @react-native-vector-icons/material-icons expects kebab-case names.
export function toMaterialIconName(icon: string): string {
  return icon.replace(/_/g, '-');
}
