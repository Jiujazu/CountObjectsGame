#!/usr/bin/env bash
# Downloads 3D emoji PNGs from the Microsoft Fluent UI Emoji repo
# (https://github.com/microsoft/fluentui-emoji, MIT-licensed) into
# images/emojis/, naming each file by its Unicode codepoint sequence
# (e.g. 1f34e.png for the Red Apple emoji).
#
# Run once from the repo root:  bash scripts/fetch-emojis.sh
# Re-runnable: existing files are skipped.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/images/emojis"
BASE="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets"

mkdir -p "$OUT_DIR"

# Mapping: "codepoint|Folder Name|file_stem"
# file_stem is the snake_case name used by Fluent for the PNG itself
# (folder "Red apple" -> file "red_apple_3d.png" -> stem "red_apple").
# Emojis that have skin-tone variants live under a Default/ subfolder
# and use a "_default" suffix; mark those rows with a trailing "|default".
EMOJIS=(
  # ----- Counting game (objectCategories in script.js) -----
  "1f34e|Red apple|red_apple"
  "1f355|Pizza|pizza"
  "1f984|Unicorn|unicorn"
  "1f436|Dog face|dog_face"
  "1f431|Cat face|cat_face"
  "1f430|Rabbit face|rabbit_face"
  "1f438|Frog|frog"
  "1f43c|Panda|panda"
  "1f428|Koala|koala"
  "1f981|Lion|lion"
  "1f42e|Cow face|cow_face"
  "1f437|Pig face|pig_face"
  "1f419|Octopus|octopus"
  "1f992|Giraffe|giraffe"
  "1f418|Elephant|elephant"
  "1f98a|Fox|fox"
  "1f43b|Bear|bear"
  "1f98b|Butterfly|butterfly"
  "1f41e|Lady beetle|lady_beetle"
  "1f995|Sauropod|sauropod"
  "1f34c|Banana|banana"
  "1f353|Strawberry|strawberry"
  "1f34a|Tangerine|tangerine"
  "1f347|Grapes|grapes"
  "1f349|Watermelon|watermelon"
  "1f955|Carrot|carrot"
  "1f344|Mushroom|mushroom"
  "1f36a|Cookie|cookie"
  "1f382|Birthday cake|birthday_cake"
  "1f36d|Lollipop|lollipop"
  "1f697|Automobile|automobile"
  "1f682|Locomotive|locomotive"
  "1f680|Rocket|rocket"
  "26f5|Sailboat|sailboat"
  "1f681|Helicopter|helicopter"
  "1f6b2|Bicycle|bicycle"
  "1f338|Cherry blossom|cherry_blossom"
  "1f333|Deciduous tree|deciduous_tree"
  "1f308|Rainbow|rainbow"
  "2b50|Star|star"
  "1f319|Crescent moon|crescent_moon"
  "1f31e|Sun with face|sun_with_face"
  "1f388|Balloon|balloon"
  "26bd|Soccer ball|soccer_ball"
  "1fa80|Yo-yo|yo-yo"
  "1f3a8|Artist palette|artist_palette"
  "1f451|Crown|crown"

  # ----- Letters game (ANLAUT_TABLE in letter-game.js) extras -----
  "1f41c|Ant|ant"
  "1f921|Clown face|clown_face"
  "1f42c|Dolphin|dolphin"
  "1f41f|Fish|fish"
  "1f994|Hedgehog|hedgehog"
  "1f42d|Mouse face|mouse_face"
  "1f443|Nose|nose|default"
  "1f442|Ear|ear|default"
  "1f427|Penguin|penguin"
  "1fabc|Jellyfish|jellyfish"
  "2600|Sun|sun"
  "1f42f|Tiger face|tiger_face"
  "1f989|Owl|owl"
  "1f426|Bird|bird"
  "1f40b|Whale|whale"
  "1f9d8|Person in lotus position|person_in_lotus_position|default"
  "1f993|Zebra|zebra"
  "1f34f|Green apple|green_apple"
  "1f6e2|Oil drum|oil_drum"
  "1f381|Wrapped gift|wrapped_gift"

  # ----- Letters game: Wort-Varianten pro Buchstabe -----
  "1f985|Eagle|eagle"           # A: Adler
  "1f3b8|Guitar|guitar"         # G: Gitarre
  "1f3e0|House|house"           # H: Haus
  "1f9ca|Ice|ice"               # I: Iglu
  "1f9e5|Coat|coat"             # J: Jacke
  "1f4a1|Light bulb|light_bulb" # L: Lampe
  "1f95c|Peanuts|peanuts"       # N: Nuss
  "1f475|Old woman|old_woman|default" # O: Oma
  "1f9e6|Socks|socks"           # S: Socke
  "1f345|Tomato|tomato"         # T: Tomate
  "231a|Watch|watch"            # U: Uhr
  "2601|Cloud|cloud"            # W: Wolke
)

urlencode() {
  python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$1"
}

downloaded=0
skipped=0
failed=0

for row in "${EMOJIS[@]}"; do
  IFS='|' read -r cp folder stem variant <<<"$row"
  out="$OUT_DIR/${cp}.png"
  if [[ -s "$out" ]]; then
    skipped=$((skipped+1))
    continue
  fi
  enc_folder=$(urlencode "$folder")
  if [[ "${variant:-}" == "default" ]]; then
    url="$BASE/${enc_folder}/Default/3D/${stem}_3d_default.png"
  else
    url="$BASE/${enc_folder}/3D/${stem}_3d.png"
  fi
  if curl -fsSL -o "$out" "$url"; then
    downloaded=$((downloaded+1))
    printf '  ok   %s  (%s)\n' "$cp" "$folder"
  else
    failed=$((failed+1))
    printf '  FAIL %s  <- %s\n' "$cp" "$url" >&2
    rm -f "$out"
  fi
done

echo
echo "downloaded: $downloaded   skipped: $skipped   failed: $failed"
