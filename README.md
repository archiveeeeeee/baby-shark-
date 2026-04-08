# BabyShark V1

Base front opérationnelle alignée sur la DA Lovable, avec un moteur local partagé prêt à être remplacé par Supabase.

## Démarrage

```bash
npm install
npm run dev
```

## Objectif de cette base

- figer la DA Lovable
- rendre les interfaces reliées entre elles
- sortir des faux écrans non connectés
- préparer le branchement final GitHub / Vercel / Supabase

## Ce qui est branché dans cette version

- store partagé persistant en `localStorage`
- enfants / parents / pré-inscriptions / contrats / factures / demandes / documents / appareils / messages
- app équipe et app famille lisent et écrivent dans le même socle
- site vitrine alimente les pré-inscriptions du back-office

## Ce qui reste à brancher avec Supabase

- auth réelle
- multi-tenant réel
- RLS
- storage documents / médias
- backend API et persistance distante

## Fichier SQL final

Le script préparatoire est dans :

`supabase/final-babyshark-v1.sql`
