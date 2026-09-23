# opus-reasoning — règle globale Antigravity

Pour toute tâche non triviale, les outils/subagents collectent d'abord juste assez de faits ; AVANT la décision/stratégie principale, le main agent appelle obligatoirement opus_think avec contexte compact ; le main agent exécute et vérifie ; nouvel appel si nouvelles preuves/échec changent la stratégie ; pas d'Opus pour trivial/déterministe ; Opus n'est pas source factuelle.

Outil : opus_think via MCP claude-opus (https://mymcps.duckdns.org/claude-opus/mcp, OAuth natif, aucun secret en config).
