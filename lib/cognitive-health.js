// MIND LOFT AND COGNITIVE HEALTH: /cognitive-health and /cognitive-health/<slug>
// (owner, 2026-11-26).
//
// WHAT THIS IS. Plain-language articles on what research says about puzzles,
// reading, jigsaws, and games and the brain, for kids, adults, and older
// adults. The owner asked for them linked from a footer column titled
// "Mind Loft and Cognitive Health" (app/Footer.jsx). The starting point was
// the September 2026 researcher outreach list (Drive:
// MindLoftResearcherOutreachList.md), whose anchors were ACTIVE, COGIT,
// PROTECT, Rush, cognitive reserve, and the Lancet Commission; each was
// re-checked against its primary source on 2026-11-26 and new angles
// (jigsaws, reading, kids, social play) were added.
//
// THE HONESTY RULE (binding, carried over from every outreach batch since
// September: "no health claims, checked programmatically"):
//   - Never say or imply that Mind Loft, or any puzzle, prevents, treats,
//     slows, or reverses dementia or any condition.
//   - Name the study design every time a finding is reported: a randomized
//     trial, or an observational (association) study. Association is never
//     written as cause.
//   - Report null and disappointing results with the same weight as positive
//     ones (the jigsaw trial, brain-training transfer, chess, the reasoning
//     and memory arms of ACTIVE).
//   - Every article ends in the same not-medical-advice note
//     (COGNITIVE_HEALTH_NOTE) and lists its sources with links.
//   - Do not name the institutions of Mind Loft's own research conversations
//     (owner, 2026-11-12). These articles do not mention them at all.
// scripts/verify-cognitive-health.mjs greps the copy for claim words.
//
// COPY RULES: no em dash, Oxford comma, Title Case for titles and headings,
// paraphrase sources (no long quotes), figures exactly as the source states.

export const COGNITIVE_HEALTH_UPDATED = '2026-11-26';

export const COGNITIVE_HEALTH_NOTE =
  'This article is general information about published research, not medical advice. Mind Loft is a free puzzle site, not a treatment, and makes no claim that its puzzles prevent, slow, or treat any condition. If you are worried about memory or thinking changes in yourself or someone you love, talk to a doctor.';

export const AUDIENCES = ['Everyone', 'Kids', 'Adults', 'Older Adults'];

export const ARTICLES = [
  {
    slug: 'do-puzzles-keep-your-brain-sharp',
    title: 'Do Puzzles Keep Your Brain Sharp? What the Research Says | Mind Loft',
    h1: 'Do Puzzles Keep Your Brain Sharp? What the Research Says',
    short: 'Do Puzzles Keep Your Brain Sharp?',
    description: 'An honest summary of the research on puzzles, games, and the brain: what trials have shown, what association studies suggest, and what is still unknown.',
    audience: ['Everyone'],
    minutes: 7,
    intro: 'People who do crosswords, sudoku, and other puzzles often hear that they are keeping their brains young. The research behind that idea is real, but it is also more careful and more mixed than the headlines. This is a plain summary of what scientists have found, how strong the evidence is, and where the honest answer is still "we do not know yet."',
    sections: [
      ['Two Kinds of Evidence', [
        'Most of what we know comes from two kinds of studies. Observational studies follow large groups of people, ask what they do, and see who keeps their thinking skills. They can show that puzzle players tend to do better, but not why. People who are already sharp may simply enjoy puzzles more, or puzzle players may also be better educated, more active, or less isolated.',
        'Randomized trials assign people to an activity by chance and compare them to a control group. They are the stronger test of cause and effect, but they are expensive, so there are far fewer of them, and most last weeks or months rather than years.',
      ]],
      ['What the Large Association Studies Found', [
        'The PROTECT study in the UK asked more than 19,000 adults aged 50 and over how often they did word and number puzzles, then gave them online thinking tests. The more often people did puzzles, the better they scored on attention, reasoning, and memory, and the differences were clearest on speed. The researchers described the gap as several years of age on some tests.',
        'In Australia, a study of 10,318 adults aged 70 and over followed for about ten years found that people who often did crosswords, puzzles, cards, chess, and similar mental activities had a 9 percent lower risk of dementia, and adult literacy activities such as writing and taking classes were linked to an 11 percent lower risk. Social outings and the size of a social network were not linked to dementia risk in that group.',
        'In Chicago, the Rush Memory and Aging Project followed about 1,900 older adults with an average age of 80. Those with the most cognitive activity, such as reading, writing letters, and playing cards or puzzles several times a week, developed Alzheimer\'s dementia at an average age of 94, about five years later than the least active group.',
      ]],
      ['What the Trials Found', [
        'Trials are more modest. A 78-week trial of 107 older adults with mild cognitive impairment compared crossword puzzles with computerized brain games. The crossword group did slightly better on the main memory and thinking test by the end, while the games group slipped slightly. That is a comparison of two activities, not puzzles against doing nothing.',
        'The largest and longest trial, ACTIVE, randomized about 2,800 adults aged 65 and over to memory, reasoning, or speed training, or no training. Twenty years later, only one group, those who did speed training plus later booster sessions, had fewer dementia diagnoses than the control group. Memory and reasoning training did not show that long-term link.',
        'A 30-day trial of daily jigsaw puzzles in 100 adults over 50 found no measurable short-term improvement in visual thinking skills, even though jigsaw skill itself was closely tied to those abilities.',
      ]],
      ['What Experts Recommend', [
        'An expert panel convened by AARP\'s Global Council on Brain Health concluded that people can influence how their brains age through mentally stimulating activity, but that the evidence for commercial "brain games" improving everyday life is weak. Their advice was to choose activities that are new to you, engaging, challenging, and enjoyable, and to combine them with physical activity and time with other people.',
        'The 2024 Lancet Commission on dementia estimated that about 45 percent of dementia cases worldwide might be prevented or delayed by addressing 14 risk factors across life, including less education in early life, hearing loss, high blood pressure, physical inactivity, and social isolation. Puzzles are not on that list by name. They are one enjoyable way to keep learning, which is part of the bigger picture.',
      ]],
    ],
    bottomLine: 'Regular puzzle players tend to have sharper thinking, and some trials point the same way, but no puzzle has been shown to prevent dementia. The best reading of the evidence is that puzzles are a good habit inside a healthy life, not a cure, and that variety, challenge, and enjoyment matter more than any one game.',
    play: [['crux', 'A daily word puzzle'], ['suds', 'A daily sudoku'], ['jig', 'A daily jigsaw']],
    related: ['crosswords-and-memory', 'brain-training-and-the-active-trial', 'dementia-risk-factors'],
    sources: [
      ['Brooker et al., number puzzles and cognitive function (PROTECT), 2019', 'https://pubmed.ncbi.nlm.nih.gov/30746778/'],
      ['Brooker et al., word puzzles and cognitive function (PROTECT), 2019', 'https://pubmed.ncbi.nlm.nih.gov/30443984/'],
      ['Leisure activities and dementia risk in older Australians (ASPREE), JAMA Network Open, 2023', 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2807256'],
      ['Wilson et al., cognitive activity and age at Alzheimer\'s dementia, Neurology, 2021 (AAN release)', 'https://www.aan.com/pressroom/home/pressrelease/4909'],
      ['Devanand et al., crosswords versus computerized games in MCI, NEJM Evidence, 2022', 'https://scholars.duke.edu/publication/1595884'],
      ['Coe et al., ACTIVE 20-year dementia follow-up, 2026 (NIH release)', 'https://www.nih.gov/news-events/news-releases/cognitive-speed-training-over-weeks-may-delay-diagnosis-dementia-over-decades'],
      ['Fissler et al., jigsaw puzzling and cognitive aging, 2018', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6174231'],
      ['Global Council on Brain Health, Engage Your Brain, 2017', 'https://www.aarp.org/health/brain-health/global-council-on-brain-health/cognitively-stimulating-activities/'],
      ['Livingston et al., 2024 Lancet Commission on dementia (summary)', 'https://www.alzheimer-europe.org/news/2024-lancet-commission-underscores-potential-dementia-risk-reduction-identifying-14-modifiable'],
    ],
  },
  {
    slug: 'crosswords-and-memory',
    title: 'Crosswords and Memory: What the Crossword Trial Found | Mind Loft',
    h1: 'Crosswords and Memory: What the Crossword Trial Found',
    short: 'Crosswords and Memory',
    description: 'A 78-week trial compared crossword puzzles with computerized brain games in older adults with mild memory problems. Here is what it found, and what it did not.',
    audience: ['Adults', 'Older Adults'],
    minutes: 5,
    intro: 'Crosswords are the classic "good for your brain" puzzle. In 2022 researchers at Columbia and Duke published one of the few randomized trials to test them directly, in older adults who already had mild memory problems. The result was encouraging, and also worth reading closely.',
    sections: [
      ['How the Study Worked', [
        'The trial enrolled 107 adults with mild cognitive impairment, a stage where memory or thinking problems are noticeable but daily life is still largely independent. Their average age was about 71. Each person was randomly assigned to do either web-based crossword puzzles or a set of computerized cognitive games at home.',
        'Both groups trained intensively for 12 weeks, then continued with booster sessions until week 78, about a year and a half. A computer platform tracked whether people were actually doing their sessions, and only about 15 percent dropped out, which is low for a long home-based study.',
      ]],
      ['What It Found', [
        'On the study\'s main measure, a standard memory and thinking test called the ADAS-Cog, the crossword group improved slightly over 78 weeks while the games group worsened slightly. The difference between them was small but statistically significant.',
        'The researchers also reported less brain shrinkage on MRI scans and better everyday functioning in the crossword group, and said those signs suggested the effect was meaningful rather than a quirk of one test.',
      ]],
      ['How to Read It', [
        'This was a comparison between two active, engaging activities, not crosswords against doing nothing. It shows crosswords held up better than a commercial brain-games program in this group. It does not show that crosswords prevent dementia, and it did not study healthy adults.',
        'The researchers highlighted engagement as part of the story. One plausible reason is that crosswords draw on vocabulary and knowledge built up over a lifetime, so people may find them more meaningful than abstract drills and keep at them. A larger follow-up trial was planned to test the question further.',
      ]],
    ],
    bottomLine: 'In a careful trial, crosswords did better than computerized brain games for older adults with mild memory problems over a year and a half. It is one of the better pieces of evidence for word puzzles, and it is still a single, modest study.',
    play: [['crux', 'Eight words, four hints, one grid'], ['emcee', 'A quick daily mini crossword'], ['encore', 'A full-size daily crossword']],
    related: ['do-puzzles-keep-your-brain-sharp', 'brain-training-and-the-active-trial', 'cognitive-reserve'],
    sources: [
      ['Devanand et al., Computerized Games versus Crosswords Training in Mild Cognitive Impairment, NEJM Evidence, 2022', 'https://scholars.duke.edu/publication/1595884'],
      ['Columbia University Irving Medical Center news release, 2022', 'https://www.eurekalert.org/news-releases/969320'],
      ['NewYork-Presbyterian, Crossword Puzzles Beat Computerized Games in Slowing Memory Loss', 'https://www.nyp.org/advances/article/psychiatry/crossword-puzzles-beat-computerized-games-in-slowing-memory-loss'],
    ],
  },
  {
    slug: 'sudoku-and-word-puzzles-after-50',
    title: 'Sudoku, Word Puzzles, and Thinking Skills After 50 | Mind Loft',
    h1: 'Sudoku, Word Puzzles, and Thinking Skills After 50',
    short: 'Sudoku and Word Puzzles After 50',
    description: 'A study of more than 19,000 adults over 50 found that frequent word and number puzzle players scored better on attention, reasoning, and memory tests.',
    audience: ['Adults', 'Older Adults'],
    minutes: 5,
    intro: 'If you reach for the sudoku or the crossword every morning, one of the largest online studies of older adults has some good news for you, along with an important caveat about what it can and cannot prove.',
    sections: [
      ['The PROTECT Study', [
        'PROTECT is a long-running online study run by the University of Exeter and King\'s College London, with tens of thousands of volunteers aged 50 and over. In two papers published in 2019, researchers asked more than 19,000 participants how often they did word puzzles, such as crosswords, and number puzzles, such as sudoku, then gave them a battery of online tests of attention, reasoning, and memory.',
      ]],
      ['What It Found', [
        'For word puzzles, every one of the 14 thinking measures showed the same pattern: people who never did word puzzles scored lowest, and scores rose with how often people played. The biggest differences were in speed.',
        'Number puzzles showed a similar link. People who did number puzzles more than once a day had the best scores on most of the core measures. The researchers translated some of the gaps into years, saying regular puzzlers performed like people about eight to ten years younger on certain tests of reasoning and short-term memory.',
      ]],
      ['What It Cannot Tell Us', [
        'This was a snapshot, not a trial. Nobody was assigned to do puzzles. People with sharper minds may simply enjoy puzzles more, and frequent puzzlers may differ in education, health, or lifestyle in ways the analysis could not fully remove. The researchers themselves said the next step is to study which puzzles, at which difficulty, might work as an intervention.',
        'So the fair summary is that regular puzzle players have sharper thinking on average, not that puzzles caused it.',
      ]],
      ['Making It Useful', [
        'If you enjoy puzzles, these findings are a reason to keep going and to stretch yourself: try a new type, move up a difficulty level, or mix word and number puzzles. Expert groups stress that challenge and novelty matter, so the same easy puzzle every day is probably less stimulating than a varied diet.',
      ]],
    ],
    bottomLine: 'Among more than 19,000 adults over 50, frequent word and number puzzle players scored better across attention, reasoning, and memory. It is a strong association, and it is not proof that puzzles cause the difference.',
    play: [['suds', 'The classic daily sudoku'], ['sums', 'A daily kakuro'], ['crux', 'A daily word grid']],
    related: ['do-puzzles-keep-your-brain-sharp', 'a-healthy-daily-puzzle-habit', 'crosswords-and-memory'],
    sources: [
      ['Brooker et al., number-puzzle use and cognitive function, International Journal of Geriatric Psychiatry, 2019', 'https://pubmed.ncbi.nlm.nih.gov/30746778/'],
      ['Brooker et al., word-puzzle use and cognitive function, International Journal of Geriatric Psychiatry, 2019', 'https://pubmed.ncbi.nlm.nih.gov/30443984/'],
      ['University of Exeter news release, 2019', 'https://news-archive.exeter.ac.uk/2019/may/title_716265_en.html'],
    ],
  },
  {
    slug: 'jigsaw-puzzles-and-the-brain',
    title: 'Jigsaw Puzzles and the Brain: What Studies Show | Mind Loft',
    h1: 'Jigsaw Puzzles and the Brain: What Studies Show',
    short: 'Jigsaw Puzzles and the Brain',
    description: 'What research says about jigsaw puzzles for toddlers and older adults: spatial skills in early childhood, and a 30-day trial in adults over 50.',
    audience: ['Kids', 'Adults', 'Older Adults'],
    minutes: 5,
    intro: 'Jigsaw puzzles are one of the most popular pastimes in the world and one of the least studied. Two lines of research stand out, one with toddlers and one with adults over 50, and together they give a useful picture of what a jigsaw asks of the brain.',
    sections: [
      ['Toddlers and Spatial Skills', [
        'In a University of Chicago study, researchers visited 53 families at home every four months while their children were between about two and four years old and recorded everyday play. Children who played with puzzles had better spatial skills at four and a half, specifically the ability to mentally rotate and fit shapes together. The link held after accounting for parents\' income, education, and how much they talked with their children.',
        'Spatial skill matters because it predicts later success in math and science. The study also noticed that boys tended to be given harder puzzles and more spatial talk from parents, a reminder to give girls the same challenge.',
      ]],
      ['Adults Over 50: A Trial', [
        'In Germany, researchers ran a randomized trial with 100 healthy adults aged 50 and over. Half did jigsaw puzzles at home for at least an hour a day for 30 days, plus four sessions of brain-health counseling. The other half got the counseling only.',
        'Jigsaw skill turned out to be closely tied to a whole set of visual thinking abilities, including perception, mental rotation, working memory, and reasoning. People with more jigsaw experience over their lifetimes also tended to have stronger visual thinking. But the 30 days of puzzling did not measurably improve those abilities compared with the counseling-only group.',
      ]],
      ['How to Read It', [
        'Together, the studies suggest jigsaws give the visual and spatial parts of thinking a real workout, and that the habit over years may matter more than a short burst. The toddler study is observational, so it cannot prove puzzles caused the skill, and the adult trial was short. Neither shows that jigsaws protect against disease.',
        'There is also a quieter benefit the German researchers pointed to: puzzles can be absorbing, calming, and satisfying, which has its own value.',
      ]],
    ],
    bottomLine: 'Jigsaws draw on many visual thinking skills at once. Early puzzle play is linked to better spatial skills in young children, while a one-month trial in older adults found no short-term gain. Think of jigsaws as a lifelong habit, not a quick fix.',
    play: [['jig', 'A new photo jigsaw every day'], ['saw', 'A tall daily jigsaw'], ['/kids/jigsaw', 'Kids Jigsaw Puzzles', 'Gentle jigsaws for young children']],
    related: ['puzzles-and-games-for-kids', 'do-puzzles-keep-your-brain-sharp', 'a-healthy-daily-puzzle-habit'],
    sources: [
      ['Levine et al., Early puzzle play: a predictor of preschoolers\' spatial transformation skill, Developmental Psychology, 2012', 'https://news.uchicago.edu/story/puzzle-play-helps-boost-learning-important-math-related-skills'],
      ['Fissler et al., Jigsaw Puzzling Taps Multiple Cognitive Abilities and Is a Potential Protective Factor for Cognitive Aging, 2018', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6174231'],
      ['PACE trial registration', 'https://clinicaltrials.gov/study/NCT02667314'],
    ],
  },
  {
    slug: 'reading-and-brain-health',
    title: 'Reading and Brain Health From Childhood to Old Age | Mind Loft',
    h1: 'Reading and Brain Health From Childhood to Old Age',
    short: 'Reading and Brain Health',
    description: 'Research on reading for pleasure in children and book reading in older adults: better test scores, better wellbeing, and a link to longer life.',
    audience: ['Kids', 'Adults', 'Older Adults'],
    minutes: 5,
    intro: 'Reading is the original brain exercise, and it shows up in the research at both ends of life. Here is what studies of children and of older adults have found.',
    sections: [
      ['Children Who Read for Fun', [
        'A 2023 study of more than 10,000 young adolescents in the large US ABCD study compared children who started reading for pleasure early, between about two and nine years old, with those who rarely did or started late. The early readers scored better on tests of verbal learning, memory, and language and did better at school. They also had fewer mental health problems, such as anxiety and attention problems, and differences in brain structure in areas tied to thinking and emotion.',
        'Around 12 hours a week of reading for pleasure was linked with the best outcomes. The study was observational, so families who encourage reading may differ in other ways, though the researchers used several methods to test whether reading itself played a role.',
      ]],
      ['Older Adults and Books', [
        'A Yale study of 3,635 adults over 50 in the US Health and Retirement Study found that people who read books had about a 20 percent lower risk of dying over 12 years than people who did not, after accounting for age, education, income, health, and other factors. Book readers lived about two years longer on average, and books were linked to a bigger advantage than newspapers or magazines. The researchers found that thinking skills helped explain the link.',
        'In the Australian study of 10,318 adults over 70, more passive activities including reading were linked to a smaller, 7 percent lower risk of dementia, while active writing, classes, and puzzles were linked to larger reductions. Rush University researchers counted reading among the everyday mental activities linked to a later onset of Alzheimer\'s dementia.',
      ]],
      ['Why Reading Might Help', [
        'Reading builds vocabulary and knowledge, which researchers see as part of cognitive reserve, the brain\'s ability to keep working well despite age or damage. Following a long story also asks for attention and memory in a way that scrolling does not.',
      ]],
    ],
    bottomLine: 'Early reading for pleasure is linked with better thinking and wellbeing in teenagers, and regular book reading is linked with longer life in older adults. These are associations, but reading is cheap, enjoyable, and good for you in many ways, so it is an easy habit to encourage at any age.',
    play: [['anon', 'A daily acrostic: solve clues to reveal a hidden passage'], ['gram', 'Ten daily grammar questions'], ['vocab', 'Ten daily vocabulary questions']],
    related: ['puzzles-and-games-for-kids', 'cognitive-reserve', 'do-puzzles-keep-your-brain-sharp'],
    sources: [
      ['Sun et al., Early-initiated childhood reading for pleasure, Psychological Medicine, 2023', 'https://www.cambridge.org/core/journals/psychological-medicine/article/earlyinitiated-childhoodreading-for-pleasure-associations-with-better-cognitive-performance-mental-wellbeing-and-brain-structure-in-young-adolescence/03FB342223A3896DB8C39F171659AE33'],
      ['University of Cambridge news release, 2023', 'https://www.cam.ac.uk/research/news/reading-for-pleasure-early-in-childhood-linked-to-better-cognitive-performance-and-mental-wellbeing'],
      ['Bavishi, Slade, and Levy, A chapter a day: Association of book reading with longevity, Social Science and Medicine, 2016', 'https://econpapers.repec.org/RePEc:eee:socmed:v:164:y:2016:i:c:p:44-48'],
      ['Leisure activities and dementia risk (ASPREE), Monash University, 2023', 'https://lens.monash.edu/2023/07/17/1385950/the-activities-most-likely-to-help-ward-off-dementia'],
    ],
  },
  {
    slug: 'puzzles-and-games-for-kids',
    title: 'Puzzles and Games for Kids: What Helps a Growing Brain | Mind Loft',
    h1: 'Puzzles and Games for Kids: What Helps a Growing Brain',
    short: 'Puzzles and Games for Kids',
    description: 'What research says about puzzles, reading, chess, and video games for children, and how to choose play that challenges without overpromising.',
    audience: ['Kids'],
    minutes: 6,
    intro: 'Parents hear a lot of claims about "educational" games. The research on children is more encouraging for some activities than others, and almost all of it comes with the same caution: children who are drawn to a given activity may already be different from those who are not.',
    sections: [
      ['Jigsaws and Building Play', [
        'A University of Chicago study that observed families at home found that children who played with puzzles between about two and four years old had better spatial skills at four and a half, even after accounting for family income and education. Spatial skill, the ability to picture and turn shapes in your head, predicts later success in math and science.',
      ]],
      ['Reading for Pleasure', [
        'In a study of more than 10,000 US adolescents, children who began reading for fun early scored better on thinking tests, did better at school, and had fewer mental health problems in early adolescence. About 12 hours of reading a week was linked to the best results.',
      ]],
      ['Chess', [
        'A review of 24 studies with more than 5,000 children found that chess lessons were linked to moderate gains in math and general thinking. But the reviewers warned that none of the studies had an ideal design, and most compared chess with doing nothing rather than with another engaging activity. Children\'s enthusiasm for chess itself may explain some of the effect.',
      ]],
      ['Video Games', [
        'A 2022 analysis of about 2,000 children aged 9 and 10 found that those who played video games three or more hours a day were very slightly faster on tests of impulse control and working memory than children who never played. The authors stressed that the differences were too small to matter clinically and that the study could not show cause and effect. It also does not settle the separate questions about sleep, mood, and time away from other activities.',
      ]],
      ['Choosing Good Play', [
        'Across these studies, the activities that look best share a few features: they are hands-on or story-rich, they get harder as the child gets better, they are done for enjoyment, and they often involve a grown-up playing alongside. Talking through a puzzle together, using words like turn, above, and fit, is part of what helps.',
        'Short, finishable puzzles suit young children. Older children can be stretched with logic puzzles, word games, and gentle competition. Keep it fun: no study suggests that drilling a reluctant child pays off.',
      ]],
    ],
    bottomLine: 'Puzzle play and reading for pleasure have the most encouraging research for kids. Chess and video games show small or uncertain effects. The best bet is varied, enjoyable play that grows with the child, ideally with an adult nearby.',
    play: [['/kids', 'Mind Loft Kids', 'Gentle daily puzzles for young children'], ['/kids/jigsaw', 'Kids Jigsaw Puzzles', 'Real photos, 6 to 30 pieces'], ['spot', 'Spot the difference']],
    related: ['jigsaw-puzzles-and-the-brain', 'reading-and-brain-health', 'a-healthy-daily-puzzle-habit'],
    sources: [
      ['Levine et al., early puzzle play and spatial skill, 2012 (University of Chicago)', 'https://news.uchicago.edu/story/puzzle-play-helps-boost-learning-important-math-related-skills'],
      ['Sun et al., childhood reading for pleasure, Psychological Medicine, 2023', 'https://www.cam.ac.uk/research/news/reading-for-pleasure-early-in-childhood-linked-to-better-cognitive-performance-and-mental-wellbeing'],
      ['Sala and Gobet, chess instruction meta-analysis, Educational Research Review, 2016', 'https://researchonline.lse.ac.uk/id/eprint/102237'],
      ['Chaarani et al., video gaming and cognitive performance among children, JAMA Network Open, 2022', 'https://jamanetwork.com/journals/jamanetworkopen/article-abstract/2797596'],
      ['NIH news release on the video gaming study, 2022', 'https://nih.gov/news-events/news-releases/video-gaming-may-be-associated-better-cognitive-performance-children'],
    ],
  },
  {
    slug: 'brain-training-and-the-active-trial',
    title: 'Brain Training and Dementia: The ACTIVE Trial at 20 Years | Mind Loft',
    h1: 'Brain Training and Dementia Risk: The ACTIVE Trial at 20 Years',
    short: 'Brain Training and the ACTIVE Trial',
    description: 'The ACTIVE trial followed about 2,800 older adults for 20 years. One kind of training was linked to fewer dementia diagnoses. What that does and does not mean.',
    audience: ['Adults', 'Older Adults'],
    minutes: 6,
    intro: 'In February 2026, researchers published 20-year results from ACTIVE, the largest randomized trial of cognitive training in older Americans. It is the first trial of its kind to look at dementia two decades later, and its findings are both striking and narrow.',
    sections: [
      ['The Trial', [
        'In 1998 and 1999, about 2,800 adults aged 65 and over were randomly assigned to one of three short training programs, memory, reasoning, or speed of processing, or to a control group with no training. The programs were up to 10 sessions of about an hour over five to six weeks. About half of each training group was also offered booster sessions roughly one and three years later.',
        'Speed of processing training is not a puzzle. It is a computer task that asks people to spot and pick out visual information quickly while their attention is divided, and it gets harder as they improve.',
      ]],
      ['The 20-Year Result', [
        'Researchers linked participants to their Medicare records to see who had been diagnosed with dementia. Among those who did speed training with boosters, 40 percent had a dementia diagnosis over the 20 years, compared with 49 percent of the control group, which the authors described as about a 25 percent lower risk.',
        'No other group showed that link. Memory training and reasoning training, with or without boosters, were not associated with fewer dementia diagnoses after 20 years, although all three types had been linked to better everyday functioning at ten years.',
      ]],
      ['How to Read It', [
        'This is strong evidence because it is randomized and very long. It is also specific: one type of training, with boosters, measured through insurance diagnoses rather than detailed testing. The researchers called for more work to understand why speed training stood out and why the others did not.',
        'A separate 2016 review of the brain-training industry found that people reliably get better at the tasks they practice, but there is little good evidence that this carries over to unrelated skills or daily life. ACTIVE is the most notable exception, and even it does not show that any app or puzzle you can buy has the same effect.',
      ]],
    ],
    bottomLine: 'A few weeks of adaptive speed training, plus boosters, was linked to fewer dementia diagnoses 20 years later in a large randomized trial. Memory and reasoning training were not. It is encouraging, it is narrow, and it is not a reason to believe claims about brain-training products in general.',
    play: [['glimpse', 'A quick flash-recall daily'], ['simon', 'Repeat the sequence'], ['witness', 'Study a scene, then answer']],
    related: ['do-puzzles-keep-your-brain-sharp', 'crosswords-and-memory', 'dementia-risk-factors'],
    sources: [
      ['NIH news release: Cognitive speed training over weeks may delay the diagnosis of dementia over decades, 2026', 'https://www.nih.gov/news-events/news-releases/cognitive-speed-training-over-weeks-may-delay-diagnosis-dementia-over-decades'],
      ['Johns Hopkins Medicine news release, 2026', 'https://www.hopkinsmedicine.org/news/newsroom/news-releases/2026/02/cognitive-speed-training-linked-to-lower-dementia-incidence-up-to-20-years-later'],
      ['Coe et al., Impact of Cognitive Training on Claims-Based Diagnosed Dementia Over 20 Years, 2026 (DOI)', 'https://doi.org/10.1002/trc2.70197'],
      ['Simons et al., Do "Brain-Training" Programs Work?, Psychological Science in the Public Interest, 2016', 'https://www.psychologicalscience.org/publications/brain-training.html'],
    ],
  },
  {
    slug: 'cognitive-reserve',
    title: 'Cognitive Reserve: Why Lifelong Learning Matters | Mind Loft',
    h1: 'Cognitive Reserve: Why Lifelong Learning Matters',
    short: 'Cognitive Reserve',
    description: 'Cognitive reserve helps explain why some brains keep working well despite age or disease. What builds it, and how mental activity across life fits in.',
    audience: ['Everyone'],
    minutes: 5,
    intro: 'Doctors have long noticed that two people with the same amount of change in the brain can function very differently. One idea that helps explain it is cognitive reserve, and it is the reason researchers care so much about how people spend their lives, not just their genes.',
    sections: [
      ['What It Is', [
        'Columbia neuroscientist Yaakov Stern, who developed much of the idea, describes cognitive reserve as the brain\'s ability to cope with age-related changes or disease by using its networks more efficiently or flexibly. It is not a thing you can see on a scan. Researchers estimate it from proxies such as years of education, the complexity of a person\'s work, vocabulary, and how much they engage in mental and social activities.',
        'In Stern\'s early work, people with less than eight years of schooling had about twice the risk of developing dementia over a few years as those with more education.',
      ]],
      ['The Clue From Rush', [
        'A Rush University study of about 1,900 older adults found that the most mentally active people developed Alzheimer\'s dementia around five years later than the least active. When participants who died were examined, their level of mental activity was not linked to the amount of Alzheimer\'s-related change in their brains.',
        'That pattern is what reserve predicts: activity may not stop the disease process, but it may help the brain keep working for longer in spite of it.',
      ]],
      ['A Trade-Off', [
        'Reserve has a sobering side. Stern and colleagues have observed that people with high reserve can decline faster once dementia does appear, because by then the underlying changes are further along. Reserve can delay symptoms, but it is not a shield.',
      ]],
      ['Building It Across Life', [
        'Education in childhood is the foundation, which is why the Lancet Commission lists less education as a risk factor. After that, the research points to staying curious: learning new skills, reading, doing challenging puzzles and games, demanding work, and staying socially involved. Starting late still counts. The Rush researchers noted that activity even in a person\'s 80s was linked to a later onset.',
      ]],
    ],
    bottomLine: 'Cognitive reserve is the idea that a lifetime of learning and mental activity helps the brain keep working despite age and disease. It does not prevent disease, but it may delay its effects, and it can be built at any age.',
    play: [['crux', 'A daily word puzzle'], ['alibi', 'A daily logic grid whodunit'], ['mate', 'A daily chess puzzle']],
    related: ['do-puzzles-keep-your-brain-sharp', 'dementia-risk-factors', 'reading-and-brain-health'],
    sources: [
      ['Stern, How Can Cognitive Reserve Promote Cognitive and Neurobehavioral Health?, 2021', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8517622'],
      ['Stern, Cognitive Reserve: Implications for Assessment and Intervention, 2013', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3970779'],
      ['Wilson et al., cognitive activity and onset age of Alzheimer\'s dementia, Neurology, 2021 (ScienceDaily)', 'https://sciencedaily.com/releases/2021/07/210714170134.htm'],
      ['Rush University: Remaining Mentally Active May Delay Dementia Onset', 'https://www.rush.edu/news/remaining-mentally-active-may-delay-dementia-onset'],
    ],
  },
  {
    slug: 'cards-board-games-and-aging',
    title: 'Cards, Board Games, and Thinking Skills in Later Life | Mind Loft',
    h1: 'Cards, Board Games, and Thinking Skills in Later Life',
    short: 'Cards, Board Games, and Aging',
    description: 'A study that followed people from age 11 to 79 found that game players had less decline in memory and thinking speed in their 70s. What it means.',
    audience: ['Older Adults'],
    minutes: 4,
    intro: 'Bridge clubs, cribbage nights, and chess in the park are more than pastimes. A remarkable Scottish study that followed the same people for almost 70 years offers some of the best long-term evidence about games and aging.',
    sections: [
      ['A 68-Year Study', [
        'The Lothian Birth Cohort 1936 is a group of 1,091 people born in 1936 who took an intelligence test at age 11. Researchers tested them again at 70, 73, 76, and 79 with 14 thinking tests, and asked at 70 and 76 how often they played games such as cards, chess, bingo, and crosswords.',
        'Because the team had everyone\'s childhood test score, they could ask a sharper question than most studies: is game playing linked to better thinking later, beyond how sharp a person already was as a child?',
      ]],
      ['What It Found', [
        'People who played games more often had better thinking at 70, even after accounting for their childhood score, education, social class, and health. Those who played more also had less decline from 70 to 79, especially in memory, and people who increased their game playing in their 70s held on to thinking speed better.',
        'The lead scientist called the link small but detectable, and noted that other habits, such as staying physically fit and not smoking, are also tied to healthier thinking with age.',
      ]],
      ['Games and Company', [
        'Many games are social, which is part of their appeal. Interestingly, the large Australian study of adults over 70 found that playing games, cards, chess, and puzzles was linked to lower dementia risk, while social outings on their own were not, in a group that was already fairly socially active. The researchers suggested that the mental challenge in games may be the active ingredient, with company as a welcome bonus.',
      ]],
    ],
    bottomLine: 'In a study spanning ages 11 to 79, regular game players kept more of their memory and thinking speed in their 70s. The effect was small, it is an association, and games work best alongside exercise, good health, and time with others.',
    play: [['finesse', 'A daily bridge puzzle'], ['mate', 'A daily chess puzzle'], ['shoe', 'A daily blackjack table']],
    related: ['cognitive-reserve', 'a-healthy-daily-puzzle-habit', 'do-puzzles-keep-your-brain-sharp'],
    sources: [
      ['Altschul and Deary, Playing Analog Games Is Associated With Reduced Declines in Cognitive Function: A 68-Year Longitudinal Cohort Study, 2020', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7021446'],
      ['University of Edinburgh news release, 2019', 'https://www.ed.ac.uk/research-innovation/latest-research-news/games-can-protect-thinking-skills-in-older-age'],
      ['Leisure activities and dementia risk (ASPREE), JAMA Network Open, 2023', 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2807256'],
    ],
  },
  {
    slug: 'dementia-risk-factors',
    title: 'The 14 Dementia Risk Factors and Where Puzzles Fit | Mind Loft',
    h1: 'The 14 Dementia Risk Factors and Where Puzzles Fit',
    short: 'The 14 Dementia Risk Factors',
    description: 'The 2024 Lancet Commission named 14 modifiable dementia risk factors linked to about 45 percent of cases. Here they are, and where mental activity fits.',
    audience: ['Adults', 'Older Adults'],
    minutes: 5,
    intro: 'If you want to look after your brain, puzzles are only a small part of the story. The most authoritative summary of the evidence, the Lancet Commission on dementia, points to a much broader list of things that matter across a whole life.',
    sections: [
      ['The 2024 Report', [
        'In July 2024, a commission of leading dementia experts updated its review of the evidence and estimated that about 45 percent of dementia cases worldwide could in principle be prevented or delayed by addressing 14 risk factors. That was up from 12 factors in its 2020 report.',
      ]],
      ['The 14 Factors', [
        'Early life: less education.',
        'Midlife: hearing loss, high LDL cholesterol, depression, traumatic brain injury, physical inactivity, diabetes, smoking, high blood pressure, obesity, and excessive alcohol.',
        'Later life: social isolation, air pollution, and untreated vision loss.',
        'High LDL cholesterol and vision loss were the two new additions in 2024. The commission found that many of the biggest opportunities are in midlife, and that people with fewer resources face more of these risks, so they have the most to gain.',
      ]],
      ['Where Puzzles Fit', [
        'Puzzles are not on the list by name. Their closest connections are to education and lifelong learning, which build cognitive reserve, and, when shared with others, to social connection. Treating hearing loss, managing blood pressure, moving more, and not smoking are all backed by stronger evidence than any puzzle.',
        'So the healthiest way to think about a daily puzzle is as one enjoyable piece of a bigger plan: keep learning, stay connected, look after your heart, avoid head injuries, and get your hearing and eyesight checked.',
      ]],
    ],
    bottomLine: 'About 45 percent of dementia cases may be linked to 14 factors that can be changed, from education to hearing, blood pressure, and isolation. Puzzles are a pleasant part of staying mentally active, but the biggest gains come from the whole list.',
    play: [['crux', 'A daily word puzzle'], ['/circuits', 'Runs', 'Play several dailies back to back']],
    related: ['cognitive-reserve', 'do-puzzles-keep-your-brain-sharp', 'a-healthy-daily-puzzle-habit'],
    sources: [
      ['Livingston et al., Dementia prevention, intervention, and care: 2024 report of the Lancet standing Commission', 'https://doi.org/10.1016/S0140-6736(24)01296-0'],
      ['Alzheimer Europe summary of the 2024 Lancet Commission', 'https://www.alzheimer-europe.org/news/2024-lancet-commission-underscores-potential-dementia-risk-reduction-identifying-14-modifiable'],
      ['Alzheimer\'s Disease International summary, 2024', 'https://www.alzint.org/news-events/news/lancet-commission-identifies-two-new-risk-factors-for-dementia-and-suggests-45-of-cases-could-be-delayed-or-reduced/'],
    ],
  },
  {
    slug: 'a-healthy-daily-puzzle-habit',
    title: 'How to Build a Healthy Daily Puzzle Habit at Any Age | Mind Loft',
    h1: 'How to Build a Healthy Daily Puzzle Habit at Any Age',
    short: 'A Healthy Daily Puzzle Habit',
    description: 'Practical, research-informed tips for a daily puzzle habit for kids, adults, and older adults: variety, challenge, enjoyment, and company.',
    audience: ['Everyone'],
    minutes: 5,
    intro: 'The research does not crown a single best puzzle. What it does suggest is a set of qualities that make mental activity worthwhile, and a few traps to avoid. Here is how to turn that into a daily habit.',
    sections: [
      ['Four Qualities That Matter', [
        'An expert panel convened by AARP\'s Global Council on Brain Health advised choosing activities that are novel, engaging, mentally challenging, and enjoyable. In practice that means trying puzzle types you have not done before, moving up in difficulty when something gets easy, and picking things you actually look forward to, since a habit you enjoy is one you keep.',
      ]],
      ['Mix It Up', [
        'Different puzzles lean on different skills: crosswords and acrostics on vocabulary and memory, sudoku and kakuro on logic and attention, jigsaws on visual and spatial thinking, chess and bridge on planning. Studies of puzzle frequency found links across word and number puzzles alike. A varied week is a good bet.',
      ]],
      ['Add People and Movement', [
        'The same experts recommend pairing mental activity with social engagement and physical exercise. Share a puzzle with a friend, compare scores with family, solve with a grandchild, or take a walk before the morning crossword. The Lancet Commission lists social isolation and physical inactivity among the major dementia risk factors.',
      ]],
      ['For Each Age', [
        'Kids: short, hands-on puzzles and reading for fun, ideally with a grown-up who talks through the turns and fits. Adults: a few minutes of something genuinely hard, not just familiar. Older adults: keep the routine, keep raising the challenge, and keep the social side, from a bridge game to a family leaderboard.',
      ]],
      ['Keep Perspective', [
        'Getting better at a particular puzzle mostly makes you better at that puzzle. That is fine. The reason to play is that it is enjoyable and keeps you learning, not that it will fix anything on its own. If you notice changes in memory or thinking that worry you, a doctor is the right next step, not a harder puzzle.',
      ]],
    ],
    bottomLine: 'Pick puzzles that are new, absorbing, hard enough, and fun. Vary them, share them, and pair them with movement and good health habits. That is the pattern the research supports.',
    play: [['/', 'Today\'s puzzles', 'Every Mind Loft daily'], ['/kids', 'Mind Loft Kids', 'Daily puzzles for young children'], ['finesse', 'A daily bridge puzzle']],
    related: ['do-puzzles-keep-your-brain-sharp', 'puzzles-and-games-for-kids', 'cards-board-games-and-aging'],
    sources: [
      ['Global Council on Brain Health, Engage Your Brain: Recommendations on Cognitively Stimulating Activities, 2017', 'https://www.aarp.org/health/brain-health/global-council-on-brain-health/cognitively-stimulating-activities/'],
      ['AARP release on the GCBH recommendations, 2017', 'https://www.aarp.org/press/releases/2017-07-25-global-council-brain-health-releases-new-recommendations-enhancing-brain-health'],
      ['Brooker et al., puzzle frequency and cognitive function (PROTECT), 2019', 'https://pubmed.ncbi.nlm.nih.gov/30443984/'],
      ['2024 Lancet Commission summary', 'https://www.alzheimer-europe.org/news/2024-lancet-commission-underscores-potential-dementia-risk-reduction-identifying-14-modifiable'],
    ],
  },
];

export const ARTICLE_MAP = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

// The footer column (app/Footer.jsx): the hub first, then these, in this order.
export const FOOTER_ARTICLES = [
  'do-puzzles-keep-your-brain-sharp',
  'crosswords-and-memory',
  'jigsaw-puzzles-and-the-brain',
  'reading-and-brain-health',
  'puzzles-and-games-for-kids',
  'brain-training-and-the-active-trial',
  'dementia-risk-factors',
];
