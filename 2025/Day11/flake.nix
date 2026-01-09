{
  description = "Elixir development environment with LSP, formatter and linter";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # NextLS - Modern Elixir LSP (better than ElixirLS for newer Elixir versions)
        next-ls = pkgs.next-ls or pkgs.elixir-ls;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Elixir and Erlang
            elixir
            erlang
            next-ls

            # Note: LSP disabled due to nixpkgs compatibility issues
            # Use mix format, credo, and AI tools instead

            # Build tools
            rebar3
            # Note: hex is installed via Mix (mix local.hex) to avoid conflicts with Helix editor

            # Useful for native dependencies
            gcc
            gnumake

            # File watching for auto-reload
            inotify-tools

            # AI tools for Helix integration
            curl
            jq
          ];

          shellHook = ''
            # ElixirLS configuration (don't set ELS_INSTALL_PREFIX, causes issues)

            # Configure Mix to install dependencies locally
            mkdir -p .nix-mix
            mkdir -p .nix-hex
            export MIX_HOME=$PWD/.nix-mix
            export HEX_HOME=$PWD/.nix-hex
            export PATH=$MIX_HOME/bin:$PATH
            export PATH=$HEX_HOME/bin:$PATH

            # Install hex and rebar if needed
            if [ ! -f $HEX_HOME/hex ]; then
              mix local.hex --force
            fi

            if [ ! -f $MIX_HOME/rebar ]; then
              mix local.rebar --force
            fi

            # Add local ai script to PATH
            export PATH=$PWD:$PATH

            echo "🧪 Elixir development environment loaded!"
            echo "Elixir version: $(elixir --version | grep Elixir)"
            echo ""
            echo "Available commands:"
            echo "  mix format      - Format code"
            echo "  mix credo       - Run linter"
            echo "  mix dialyzer    - Type checking"
            echo "  ai-groq-explain - AI code assistance"
            echo ""
          '';
        };
      }
    );
}
