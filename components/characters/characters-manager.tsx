"use client";

import { useState } from "react";
import { CharacterCard } from "@/components/characters/character-card";
import { CreateCharacterForm } from "@/components/characters/create-character-form";
import type { CharacterWithUrl } from "@/lib/characters/list";

export function CharactersManager({ initialCharacters }: { initialCharacters: CharacterWithUrl[] }) {
  const [characters, setCharacters] = useState(initialCharacters);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CreateCharacterForm
        onCreated={(character) => setCharacters((prev) => [character, ...prev])}
      />

      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          onDeleted={(id) => setCharacters((prev) => prev.filter((c) => c.id !== id))}
          onUpdated={(id, patch) =>
            setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
          }
        />
      ))}
    </div>
  );
}
