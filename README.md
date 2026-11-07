# NURSERIK CHEMISTRY

Платформа для самостоятельного изучения химии и развития критического мышления. Автор образовательной концепции — Хуантхан Нурсерик, учитель химии.

Сайт: https://miraskees-coder.github.io/nurserik-himia/

| Страница | Адрес |
|---|---|
| Главная | `/` |
| Курс «Химическая кинетика, 10 класс» | `/kinetics/` |
| Тренажёр «Critical Thinking Lab» | `/trainer/` |
| Об исследовании | `/research/` |

## Запуск и сборка

Нужен только Node.js 18+, зависимостей нет.

```sh
node build.mjs          # собрать index.html, research/, kinetics/
node --test tests/engine.test.mjs  # юнит-тесты движка задач
node tests/browser.mjs  # браузерные тесты (нужен Google Chrome)
```

Текст в исходниках пишется на трёх языках в маркерах `⟦қазақша‖русский‖english⟧`. Подробнее — в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Документы

- [docs/AUDIT.md](docs/AUDIT.md) — аудит исходного сайта.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура, план этапов, правила безопасности.
- [docs/DATABASE.md](docs/DATABASE.md) — схема данных и правила доступа (к этапу 3).
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — публикация, поисковики, подключение Supabase и ИИ.
- [docs/ASSESSMENT_RUBRIC.md](docs/ASSESSMENT_RUBRIC.md) — рубрика и правила автоматической оценки.
- [docs/CHEMISTRY_MODELS.md](docs/CHEMISTRY_MODELS.md) — формулы, допущения и ограничения моделей.
- [RESEARCH_METHODOLOGY.md](RESEARCH_METHODOLOGY.md) — методология магистерского исследования.
- [CLAUDE.md](CLAUDE.md) — правила разработки.

Сайт разработан с помощью ИИ-инструментов (Claude). Внешние JS-библиотеки не используются, шрифты подключаются из Google Fonts.
