#!/bin/bash
# ダブルクリックで、編集内容を GitHub に送ってサイトを更新します。
cd "$(dirname "$0")" || exit 1

echo "== UEC Fencers Club サイト更新 =="
echo

if [ -z "$(git status --porcelain)" ]; then
  echo "変更されたファイルはありません。更新するものがないので終了します。"
else
  echo "変更されたファイル:"
  git status --short
  echo
  if ! git add -A || ! git commit -q -m "update: $(date '+%Y-%m-%d %H:%M') サイト更新"; then
    echo "[失敗] 変更の記録に失敗しました。上のメッセージを確認してください。"
    read -n 1 -s -r -p "何かキーを押すと閉じます"
    exit 1
  fi
fi

if ! git pull --rebase -q origin main; then
  echo "[失敗] GitHub 側の変更と食い違いがありました。自動では直せないので、Claude に相談してください。"
  git rebase --abort 2>/dev/null
  read -n 1 -s -r -p "何かキーを押すと閉じます"
  exit 1
fi

if git push -q origin main; then
  echo "[完了] GitHub に送りました。1〜2分で下のページに反映されます。"
  echo "  https://1129kurakura.github.io/uecfencers/"
else
  echo "[失敗] 送信に失敗しました。ネット接続を確認して、もう一度ダブルクリックしてください。"
fi

echo
read -n 1 -s -r -p "何かキーを押すと閉じます"
