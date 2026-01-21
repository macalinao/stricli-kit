{ pkgs, ... }:

{
  packages = with pkgs; [
    bun
    nodejs_24
    ast-grep
    biome
    gnused
  ];

  languages.typescript.enable = true;

  scripts.stricli-kit.exec = ''
    bun "$DEVENV_ROOT/packages/stricli-kit/dist/bin/cli.js" "$@"
  '';

  scripts.progenitor.exec = ''
    bun "$DEVENV_ROOT/packages/progenitor/dist/bin/cli.js" "$@"
  '';

  processes.build-watch.exec = "cd $DEVENV_ROOT && bun build:watch";
  processes.progenitor-dev.exec = "cd $DEVENV_ROOT/packages/progenitor && stricli-kit dev";

  pre-commit.hooks = {
    nixfmt.enable = true;

    biome.enable = true;

    prettier = {
      enable = true;
      excludes = [
        "\\.js$"
        "\\.jsx$"
        "\\.ts$"
        "\\.tsx$"
        "\\.json$"
        "\\.jsonc$"
      ];
    };
  };
}
