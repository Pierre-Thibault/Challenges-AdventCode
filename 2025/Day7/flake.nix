{
  description = "Environnement de développement Nim avec LSP, formatteur et linter";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Compilateur Nim
            nim

            # LSP pour Nim
            nimlsp
            nimlangserver

            # Outils de développement
            nimble # gestionnaire de paquets Nim

            # Outils supplémentaires utiles
            gcc
            gdb
          ];

          shellHook = ''
            echo "🎯 Environnement de développement Nim activé"
            echo "📦 Nim version: $(nim --version | head -1)"
            echo "🔧 Outils disponibles:"
            echo "  - nim: compilateur Nim"
            echo "  - nimlsp: Language Server Protocol"
            echo "  - nimpretty: formatteur de code (intégré à nim)"
            echo "  - nim check: linter/vérificateur de syntaxe"
            echo "  - nimble: gestionnaire de paquets"
            echo ""
            echo "💡 Commandes utiles:"
            echo "  nim c fichier.nim          # compiler"
            echo "  nim r fichier.nim          # compiler et exécuter"
            echo "  nim check fichier.nim      # linter/vérifier"
            echo "  nim pretty fichier.nim     # formater (ou nimpretty)"
            echo "  nimble init                # initialiser projet"
            echo ""
          '';

          # Variables d'environnement
          NIX_SHELL_PRESERVE_PROMPT = 1;
        };
      }
    );
}
