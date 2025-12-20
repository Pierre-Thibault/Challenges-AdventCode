{
  description = "Advent of Code 2025 Day 8 - Go";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Go toolchain (includes gofmt)
            go

            # LSP
            gopls

            # Formatter (stricter than gofmt)
            gofumpt

            # Linter
            golangci-lint

            # Additional useful tools
            gotools      # includes goimports, godoc, etc.
            delve        # debugger
          ];

          shellHook = ''
            echo "Go development environment loaded"
            echo "Go version: $(go version)"
            echo ""
            echo "Available tools:"
            echo "  - gopls (LSP server)"
            echo "  - gofmt / gofumpt (formatters)"
            echo "  - golangci-lint (linter)"
            echo "  - goimports (import formatter)"
            echo "  - delve (debugger)"
          '';
        };
      }
    );
}
