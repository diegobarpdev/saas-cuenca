# Skills del Proyecto (`.agents/skills/`)

Este directorio contiene las **skills personalizadas** para los agentes de IA que trabajan en el proyecto **Kaltiro.com**.

## Estructura de Skills

Cada skill debe ubicarse en su propia carpeta dentro de `.agents/skills/` con un archivo `SKILL.md`:

```text
.agents/
└── skills/
    └── nombre-de-la-skill/
        ├── SKILL.md
        └── (recursos o scripts opcionales)
```

## Formato del archivo `SKILL.md`

```yaml
---
name: nombre-de-la-skill
description: Descripción clara de la skill y cuándo debe activarse.
---

# Instrucciones
Detalle de las pautas, comandos y mejores prácticas que el agente debe seguir.
```
