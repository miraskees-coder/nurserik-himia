# База данных (проект, этап 3)

> Статус: **спроектировано, не развёрнуто.** SQL-миграции с политиками RLS будут добавлены в `supabase/migrations/` на этапе 3, после создания проекта Supabase. До этого все результаты хранятся только в браузере ученика, и интерфейс прямо об этом сообщает.

## Принципы

- PostgreSQL (Supabase), Row Level Security включён на **всех** таблицах.
- Роль хранится в `profiles.role` (`student`, `teacher`, `researcher`, `admin`). Пользователь не может изменить её сам: политика запрещает `update` этого поля, а назначает роль администратор.
- Ученик видит только свои строки (`user_id = auth.uid()`).
- Учитель видит строки учеников своих классов: проверка через `class_memberships` и `classes.teacher_id = auth.uid()`.
- Исследователь видит только исследовательские таблицы с псевдонимом `participant_code`. Связь «псевдоним — ученик» хранится в отдельной таблице, доступной только администратору исследования.
- Итоговые оценки, контрольные варианты и сертификаты пишутся только серверной функцией (Edge Function с `service_role`). Клиенту запрещён `insert` и `update` этих полей.

## Сущности

| Группа | Таблицы |
|---|---|
| Пользователи | `profiles` (id = auth.users.id, display_name, grade, lang, role, consent_at), `audit_logs` |
| Классы | `classes` (teacher_id, name, join_code), `class_memberships` (class_id, user_id, joined_at) |
| Контент | `courses`, `modules`, `lessons` (curriculum_code — вводится вручную по программе), `videos` |
| Прогресс | `enrollments`, `lesson_progress` |
| Задачи | `problem_templates` (id, version), `problem_attempts` (template, seed, params, answers jsonb, auto_scores jsonb, mode: practice / exam / research) |
| Тесты | `question_banks`, `questions`, `assessment_assignments`, `assessment_attempts`, `student_responses` |
| Критическое мышление | `ct_attempts` (этапы jsonb — та же структура, что в экспорте тренажёра), `rubric_scores` (attempt_id, criterion K1–K5, score 0–4, source: auto / teacher, rubric_version, scored_by) |
| Лаборатория | `lab_experiments`, `lab_attempts`, `lab_observations` |
| Достижения | `achievements`, `user_achievements` |
| Сертификаты | `certificates` (code unique, user_id, course_id, issued_at, final_score), публичная проверка по `code` через функцию, раскрывающую только имя, курс и дату |
| Исследование | `research_projects` (протокол фиксируется до начала: `protocol jsonb`, `locked_at`), `research_groups` (experimental / control, описание условий), `research_participants` (participant_code, group_id), `research_assessments` (этап: pre / post, версия инструмента), `research_results` |

## Ключевые ограничения

- `rubric_scores.score between 0 and 4`; уникальность `(attempt_id, criterion, source)`. Каждое изменение учительской оценки дублируется в `audit_logs` со старым и новым значением.
- Результаты тренировки (`mode = practice`) не смешиваются с независимой диагностикой (`mode = research`). Поле обязательно, а исследовательские выборки фильтруются по нему.
- Отсутствующие результаты остаются `null` и ничем не заполняются.
- Индексы: `(user_id, created_at)` на таблицах попыток, `(class_id)` на `class_memberships`, `(research_project_id, stage)` на исследовательских таблицах.

## Регистрация несовершеннолетних

- Ученик регистрируется только с кодом класса от учителя.
- Собираются: отображаемое имя (можно псевдоним), класс, язык. Без даты рождения, телефона и адреса.
- Отметка о согласии родителя или законного представителя (`consent_at`) ставится учителем после получения бумажного согласия. Требования законодательства РК и процедуры школы уточняются у администрации.
