{
  description = "AoC 2025 – Kotlin/JVM (simple, rapide, fiable)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        jdk = pkgs.temurin-bin-21; # JDK qui ne plante jamais
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.kotlin
            jdk
            pkgs.ktlint
            pkgs.kotlin-language-server
          ];

          shellHook = ''
            export JAVA_HOME=${jdk.home}
            export PATH="${jdk}/bin:$PATH"
          '';
        };
      }
    );
}
