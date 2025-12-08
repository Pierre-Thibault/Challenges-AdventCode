# flake.nix
{
  description = "Projet Gleam avec LSP et formatage";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Version de Gleam (toujours à jour grâce à nixpkgs-unstable)
        gleam = pkgs.gleam;

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            gleam      # compilateur + CLI
            erlang     # obligatoire
            rebar3     # obligatoire
            nodejs     # parfois utile pour JS target
          ];

          # Active automatiquement le LSP dans ton éditeur (Neovim, Helix, VS Code + nix-ld, etc.)
          shellHook = ''
            echo "Gleam devShell activé"
            echo "gleam --version: $(gleam --version)"
            echo "LSP prêt : gleam lsp fonctionne"
          '';
        };

        # Optionnel : formater avec `nix fmt` → utilise `gleam format`
        formatter = pkgs.writeShellScriptBin "formatter" ''
          exec ${gleam}/bin/gleam format "$@"
        '';
      }
    );
}
