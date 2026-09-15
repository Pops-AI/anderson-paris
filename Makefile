.PHONY: help dev verifier test health

help:
	@echo "dev       Serveur local sur http://localhost:8000"
	@echo "verifier  Regles de marque + coherence entre pages"
	@echo "test      Alias de verifier"
	@echo "health    Verifie que le serveur local repond"

dev:
	node scripts/serveur.mjs

verifier:
	node scripts/verifier.mjs

test: verifier

health:
	@curl -fsS -o /dev/null -w "%{http_code} /\n" http://localhost:8000/ && curl -fsS -o /dev/null -w "%{http_code} /cgv\n" http://localhost:8000/cgv || echo "Serveur local indisponible : lancer make dev"
