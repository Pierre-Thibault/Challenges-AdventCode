{
  description = "Advent of Code 2025 Day 10 - Deno development environment";

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
            deno
          ];

          shellHook = ''
            echo "Advent of Code 2025 - Day 10"
            echo "Deno version: $(deno --version | head -n1)"
            echo ""
            echo "Available commands:"
            echo "  deno run solution.ts          - Run the solution"
            echo "  deno fmt                       - Format code"
            echo "  deno lint                      - Lint code"
            echo "  deno check solution.ts         - Type check"
          '';
        };
      }
    );
}
