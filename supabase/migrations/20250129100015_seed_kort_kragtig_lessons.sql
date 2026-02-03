-- Voorbeeld lesse vir Kort & Kragtig (Kinderkerk)
-- Voeg slegs by as daar nog geen gepubliseerde lesse is nie
-- Skip as kk_lessons nie bestaan nie (shadow DB); safe for db pull.

DO $$
DECLARE
  lid uuid;
  bestaande integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kk_lessons') THEN
    RETURN;
  END IF;
  SELECT COUNT(*) INTO bestaande FROM public.kk_lessons WHERE status = 'PUBLISHED';
  IF bestaande > 0 THEN
    RETURN; -- Skip as daar reeds lesse is
  END IF;
  -- Les 1: Jesus se Liefde
  INSERT INTO public.kk_lessons (title, passage_reference, theme_tags, age_band, difficulty, summary, core_truths, status)
  VALUES (
    'Jesus se Liefde',
    'Johannes 3:16',
    ARRAY['Jesus', 'Liefde'],
    '6-11',
    1,
    'Jesus het ons so baie lief dat Hy vir ons gesterf het. Sy liefde is vir almal.',
    ARRAY['God het die wêreld so lief gehad', 'Jesus het vir ons gesterf', 'Elkeen wat in Hom glo het ewige lewe'],
    'PUBLISHED'
  )
  RETURNING id INTO lid;

  IF lid IS NOT NULL THEN
    INSERT INTO public.kk_lesson_variants (lesson_id, variant_type, hook_text, story_text, explanation_points, parent_prompt)
    VALUES
      (lid, 'SHORT', 'Het jy al ooit iemand so baie liefgehê dat jy enigiets vir hulle sou doen?', 'Jesus het die hele wêreld so lief gehad dat Hy Sy enigste Seun gegee het. Elkeen wat in Hom glo, sal nie vergaan nie maar ewige lewe hê. (Johannes 3:16)', ARRAY['Jesus se liefde is vir almal', 'Hy het vir ons gesterf', 'Ons kan Sy kinders word'], 'Bid saam: Dankie Jesus vir jou groot liefde.'),
      (lid, 'STANDARD', 'Het jy al ooit iemand so baie liefgehê dat jy enigiets vir hulle sou doen? Jesus se liefde is selfs groter!', 'Jesus het die hele wêreld so lief gehad dat Hy Sy enigste Seun gegee het. Elkeen wat in Hom glo, sal nie vergaan nie maar ewige lewe hê. (Johannes 3:16) Jesus se liefde is nie net vir sommige mense nie – dit is vir JOU en vir almal.', ARRAY['Jesus se liefde is vir almal', 'Hy het vir ons gesterf', 'Ons kan Sy kinders word', 'Sy liefde verander nooit'], 'Bid saam: Dankie Jesus vir jou groot liefde. Help my om ander ook lief te hê.');

    INSERT INTO public.kk_questions (lesson_id, question_type, question_text, options, correct_answer, hint_text, explanation, variant_type)
    VALUES
      (lid, 'MULTIPLE_CHOICE', 'Wat sê Johannes 3:16 dat God vir die wêreld gedoen het?', ARRAY['Hy het die wêreld geskep', 'Hy het Sy Seun gegee', 'Hy het die see gemaak', 'Hy het die son geskep'], 'Hy het Sy Seun gegee', 'Dink aan die grootste geskenk wat iemand ooit kon gee.', 'God het Sy enigste Seun, Jesus, gegee sodat ons ewige lewe kan hê.', 'STANDARD'),
      (lid, 'MULTIPLE_CHOICE', 'Vir wie het Jesus gesterf?', ARRAY['Net vir sy vriende', 'Net vir goeie mense', 'Vir die hele wêreld', 'Net vir kinders'], 'Vir die hele wêreld', 'Die Bybel sê "die wêreld" – dit beteken almal!', 'Jesus se liefde is vir almal – groot en klein, van oral oor die wêreld.', 'STANDARD');
  END IF;

  -- Les 2: Die Verlore Skape
  INSERT INTO public.kk_lessons (title, passage_reference, theme_tags, age_band, difficulty, summary, core_truths, status)
  VALUES (
    'Die Verlore Skape',
    'Lukas 15:3-7',
    ARRAY['Stories', 'Jesus'],
    '6-11',
    1,
    'Jesus vertel van ''n herder wat sy verlore skaap soek. So soek God ook na ons.',
    ARRAY['Jesus soek na verlore mense', 'God is bly wanneer ons terugkom', 'Elke persoon is vir God belangrik'],
    'PUBLISHED'
  )
  RETURNING id INTO lid;

  IF lid IS NOT NULL THEN
    INSERT INTO public.kk_lesson_variants (lesson_id, variant_type, hook_text, story_text, explanation_points, parent_prompt)
    VALUES
      (lid, 'SHORT', 'Het jy al iets belangriks verloor? Hoe het jy gevoel?', 'Jesus vertel van ''n herder met 100 skape. Een het weggeraak. Die herder laat die 99 en gaan soek na die een verlore skaap. Wanneer hy dit vind, is hy so bly! So is God ook bly wanneer een mens wat verlore was, terugkom.', ARRAY['God soek na ons', 'Elke persoon is belangrik', 'God is bly wanneer ons terugkom'], 'Bid: Dankie Vader dat U na my soek.'),
      (lid, 'STANDARD', 'Het jy al iets belangriks verloor? Hoe het jy gevoel? Jesus vertel ''n storie van iemand wat soek...', 'Jesus vertel van ''n herder met 100 skape. Een het weggeraak. Die herder laat die 99 in die wyk en gaan soek na die een verlore skaap. Wanneer hy dit vind, dra hy dit op sy skouers huis toe en roep sy vriende: "Wees bly saam met my – ek het my verlore skaap gevind!" So, sê Jesus, is daar meer vreugde in die hemel oor een sondaar wat berou het as oor 99 wat nie dit nodig het nie.', ARRAY['God soek na ons soos die herder', 'Elke persoon is vir God belangrik', 'God is bly wanneer ons terugkom', 'Ons is nooit te ver weg nie'], 'Bid: Dankie Vader dat U na my soek. Help my om na U terug te kom.');

    INSERT INTO public.kk_questions (lesson_id, question_type, question_text, options, correct_answer, hint_text, explanation, variant_type)
    VALUES
      (lid, 'MULTIPLE_CHOICE', 'Hoeveel skape het die herder gehad?', ARRAY['10', '50', '99', '100'], '100', 'Dit was baie skape!', 'Die herder het 100 skape gehad, en een het weggeraak.', 'STANDARD'),
      (lid, 'MULTIPLE_CHOICE', 'Wat doen die herder wanneer hy die verlore skaap vind?', ARRAY['Hy skree vir dit', 'Hy dra dit op sy skouers huis toe', 'Hy verkoop dit', 'Hy vergeet daarvan'], 'Hy dra dit op sy skouers huis toe', 'Hy was so bly dat hy dit nie kon los nie!', 'Die herder was so bly dat hy die skaap op sy skouers gedra het.', 'STANDARD');
  END IF;

  -- Les 3: Ons Vader
  INSERT INTO public.kk_lessons (title, passage_reference, theme_tags, age_band, difficulty, summary, core_truths, status)
  VALUES (
    'Ons Vader in die Hemel',
    'Matteus 6:9-13',
    ARRAY['Gebed', 'Jesus'],
    '6-11',
    1,
    'Jesus leer ons hoe om te bid. Ons kan God "Vader" noem.',
    ARRAY['God is ons Vader', 'Jesus leer ons bid', 'Ons kan altyd met God praat'],
    'PUBLISHED'
  )
  RETURNING id INTO lid;

  IF lid IS NOT NULL THEN
    INSERT INTO public.kk_lesson_variants (lesson_id, variant_type, hook_text, story_text, explanation_points, parent_prompt)
    VALUES
      (lid, 'SHORT', 'Met wie praat jy wanneer jy bid?', 'Jesus se dissipels het Hom gevra: "Leer ons bid." Jesus het vir hulle die "Ons Vader" gebed gegee. Ons begin met "Ons Vader wat in die hemel is" – God is soos ''n perfekte Vader vir ons. Ons kan altyd met Hom praat.', ARRAY['God is ons Vader', 'Jesus het ons geleer om te bid', 'Ons kan altyd met God praat'], 'Bid die Ons Vader saam.'),
      (lid, 'STANDARD', 'Met wie praat jy wanneer jy bid? Jesus het sy vriende geleer hoe om te bid.', 'Jesus se dissipels het Hom gevra: "Leer ons bid." Jesus het vir hulle die "Ons Vader" gebed gegee. "Ons Vader wat in die hemel is, laat u Naam geheilig word..." God is soos ''n perfekte Vader vir ons – Hy luister, Hy sorg, Hy is altyd daar. Ons kan enige tyd met Hom praat, net soos ''n kind met sy pa.', ARRAY['God is ons Vader', 'Jesus het ons geleer om te bid', 'Ons kan altyd met God praat', 'Bid is ''n gesprek met God'], 'Bid die Ons Vader saam. Praat ook vandag met God oor iets wat jou pla.');

    INSERT INTO public.kk_questions (lesson_id, question_type, question_text, options, correct_answer, hint_text, explanation, variant_type)
    VALUES
      (lid, 'MULTIPLE_CHOICE', 'Wat noem Jesus God in die gebed?', ARRAY['Koning', 'Vader', 'Heer', 'Meester'], 'Vader', 'Dit begin met "Ons Vader..."', 'Jesus leer ons om God "Vader" te noem – Hy sorg vir ons soos ''n pa.', 'STANDARD'),
      (lid, 'MULTIPLE_CHOICE', 'Wie het Jesus gevra om hulle te leer bid?', ARRAY['Die Fariseërs', 'Sy dissipels', 'Die kinders', 'Pilatus'], 'Sy dissipels', 'Dit was Jesus se naaste vriende.', 'Jesus se dissipels het gesien hoe Hy bid en wou self ook so bid.', 'STANDARD');
  END IF;

  -- Les 4: Die Vrug van die Gees - Liefde
  INSERT INTO public.kk_lessons (title, passage_reference, theme_tags, age_band, difficulty, summary, core_truths, status)
  VALUES (
    'Liefde - Vrug van die Gees',
    'Galasiërs 5:22-23',
    ARRAY['Vrug van die Gees', 'Liefde'],
    '6-11',
    2,
    'Die Heilige Gees gee ons liefde. Liefde is die eerste "vrug" van die Gees.',
    ARRAY['Die Gees gee ons liefde', 'Liefde kom van God', 'Ons kan ander liefhê deur God'],
    'PUBLISHED'
  )
  RETURNING id INTO lid;

  IF lid IS NOT NULL THEN
    INSERT INTO public.kk_lesson_variants (lesson_id, variant_type, hook_text, story_text, explanation_points, parent_prompt)
    VALUES
      (lid, 'SHORT', 'Wat beteken dit om iemand "lief te hê"?', 'Die Bybel sê die "vrug van die Gees" is liefde, vreugde, vrede... Liefde is die eerste een! God se Gees help ons om ander lief te hê – nie net mense wat ons lekker vind nie, maar ook die wat moeilik is.', ARRAY['Liefde kom van die Gees', 'God help ons om lief te hê', 'Liefde is ''n keuse'], 'Bid: Vader, help my om vandag iemand met liefde te behandel.'),
      (lid, 'STANDARD', 'Wat beteken dit om iemand "lief te hê"? Die Bybel praat van die "vrug van die Gees"...', 'In Galasiërs 5 sê die Bybel die vrug van die Gees is: liefde, vreugde, vrede, geduld, vriendelikheid, goedheid, getrouheid, sagmoedigheid, selfbeheersing. Liefde is die eerste! Dit beteken die Heilige Gees werk in ons om ander lief te hê – nie net ons vriende nie, maar ook mense wat ons moeilik vind. Jesus het ons geleer: "Hou mekaar lief soos Ek julle liefgehad het."', ARRAY['Liefde kom van die Gees', 'God help ons om lief te hê', 'Liefde is ''n keuse', 'Ons kan nie alleen nie – ons het God nodig'], 'Bid: Vader, help my om vandag iemand met liefde te behandel. Wys my wie.');

    INSERT INTO public.kk_questions (lesson_id, question_type, question_text, options, correct_answer, hint_text, explanation, variant_type)
    VALUES
      (lid, 'MULTIPLE_CHOICE', 'Wat is die eerste "vrug van die Gees"?', ARRAY['Vreugde', 'Liefde', 'Vrede', 'Geduld'], 'Liefde', 'Galasiërs 5:22 noem dit eerste.', 'Liefde is die eerste vrug van die Gees wat die Bybel noem.', 'STANDARD'),
      (lid, 'MULTIPLE_CHOICE', 'Van waar kom ons vermoë om ander lief te hê?', ARRAY['Ons eie krag', 'Die Heilige Gees', 'Ons ouers', 'Skool'], 'Die Heilige Gees', 'Die "vrug" groei wanneer die Gees in ons werk.', 'Die Heilige Gees werk in ons en help ons om ander lief te hê.', 'STANDARD');
  END IF;

END $$;
