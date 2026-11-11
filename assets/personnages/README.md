# Personnages

Source : packs gratuits de Quaternius, licence CC0.

- Universal Base Characters (version Standard) : https://quaternius.itch.io/universal-base-characters
- Universal Animation Library (version Standard) : https://quaternius.itch.io/universal-animation-library

Les archives brutes ne sont pas versionnées. Pour régénérer `app/public/models` :

1. Télécharger les deux archives « Standard » (gratuites).
2. Extraire dans ce dossier :
   - `base/` : les dossiers `Base Characters/Godot - UE` et `Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)` du premier pack, avec `License_Standard.txt` ;
   - `animations/` : `UAL1_Standard.glb` et `License.txt` du second.
3. Lancer `node prepare.mjs` depuis ce dossier.
