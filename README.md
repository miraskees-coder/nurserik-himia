# NURSERIK CHEMISTRY

Платформа для самостоятельного изучения химии и развития критического мышления. Автор образовательной концепции — Хуантхан Нурсерик, учитель химии.

Сайт: https://miraskees-coder.github.io/nurserik-himia/

| Страница | Адрес |
|---|---|
| Главная | `/` |
| Курс «Химическая кинетика, 10 класс» | `/kinetics/` |
| Об исследовании | `/research/` |

## Запуск и сборка

Нужен только Node.js 18+, зависимостей нет.

```sh
node build.mjs          # собрать index.html, research/, kinetics/
node tests/browser.mjs  # браузерные тесты (нужен Google Chrome)
```

Текст в исходниках пишется на трёх языках в маркерах `⟦қазақша‖русский‖english⟧`. Подробнее — в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Документы

- [docs/AUDIT.md](docs/AUDIT.md) — аудит исходного сайта.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура, план этапов, правила безопасности.
- [RESEARCH_METHODOLOGY.md](RESEARCH_METHODOLOGY.md) — методология магистерского исследования.

Сайт разработан с помощью ИИ-инструментов (Claude). Внешние JS-библиотеки не используются, шрифты подключаются из Google Fonts.
