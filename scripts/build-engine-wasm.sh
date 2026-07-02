#!/usr/bin/env bash
# Build engine-wasm for the browser (wasm32-unknown-unknown) and run wasm-bindgen.
#
# ring (iroh tls-ring) compiles C code for wasm32; Apple clang does not support
# that target. Use LLVM clang instead:
#   brew install llvm   # macOS
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="debug"
CARGO_ARGS=()

for arg in "$@"; do
	case "$arg" in
	--release)
		PROFILE="release"
		CARGO_ARGS+=(--release)
		;;
	esac
done

if [[ -z "${CC:-}" ]]; then
	if [[ -x /opt/homebrew/opt/llvm/bin/clang ]]; then
		export CC=/opt/homebrew/opt/llvm/bin/clang
	elif [[ -x /usr/local/opt/llvm/bin/clang ]]; then
		export CC=/usr/local/opt/llvm/bin/clang
	fi
fi

cd "$ROOT/engine-wasm"
export CARGO_TARGET_DIR="$ROOT/engine-wasm/target"
cargo build --target wasm32-unknown-unknown "${CARGO_ARGS[@]}"

WASM_PATH="$CARGO_TARGET_DIR/wasm32-unknown-unknown/$PROFILE/engine_wasm.wasm"
OUT_DIR="$ROOT/frontend/src/wasm/pkg"

if ! command -v wasm-bindgen >/dev/null 2>&1; then
	echo "wasm-bindgen not found; installing wasm-bindgen-cli..."
	cargo install wasm-bindgen-cli --locked
fi

mkdir -p "$OUT_DIR"
wasm-bindgen "$WASM_PATH" \
	--target web \
	--out-dir "$OUT_DIR" \
	--out-name engine_wasm \
	--typescript

echo "WASM package written to $OUT_DIR"
