import type { AzkarPeriod } from "./types";

export interface AzkarEnglish {
  transliteration: string;
  translation: string;
}

const shared: Readonly<Record<string, AzkarEnglish>> = {
  "75": {
    transliteration:
      "Allāhu lā ilāha illā Huwa, al-Ḥayyul-Qayyūm. Lā taʾkhudhuhu sinatun wa lā nawm. Lahu mā fis-samāwāti wa mā fil-arḍ. Man dhal-ladhī yashfaʿu ʿindahu illā biʾidhnih. Yaʿlamu mā bayna aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishayʾin min ʿilmihi illā bimā shāʾ. Wasiʿa kursiyyuhus-samāwāti wal-arḍ, wa lā yaʾūduhu ḥifẓuhumā, wa Huwal-ʿAliyyul-ʿAẓīm.",
    translation:
      "Allah—there is no deity except Him, the Ever-Living, the Sustainer of all. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Footstool extends over the heavens and the earth, and preserving them does not tire Him. He is the Most High, the Magnificent.",
  },
  "76a": {
    transliteration:
      "Qul Huwallāhu Aḥad. Allāhuṣ-Ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahu kufuwan aḥad.",
    translation:
      "Say: He is Allah, the One. Allah, the Self-Sufficient. He neither begets nor is born, and there is none comparable to Him.",
  },
  "76b": {
    transliteration:
      "Qul aʿūdhu birabbil-falaq. Min sharri mā khalaq. Wa min sharri ghāsiqin idhā waqab. Wa min sharrin-naffāthāti fil-ʿuqad. Wa min sharri ḥāsidin idhā ḥasad.",
    translation:
      "Say: I seek refuge in the Lord of daybreak, from the evil of what He created, from the evil of the night when it grows dark, from the evil of those who blow on knots, and from the evil of an envier when he envies.",
  },
  "76c": {
    transliteration:
      "Qul aʿūdhu birabbin-nās. Malikin-nās. Ilāhin-nās. Min sharril-waswāsil-khannās. Alladhī yuwaswisu fī ṣudūrin-nās. Minal-jinnati wan-nās.",
    translation:
      "Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers into the hearts of mankind, from among jinn and mankind.",
  },
  "79": {
    transliteration:
      "Allāhumma ʿālimal-ghaybi wash-shahādah, fāṭiras-samāwāti wal-arḍ, rabba kulli shayʾin wa malīkah. Ashhadu an lā ilāha illā Ant. Aʿūdhu bika min sharri nafsī, wa min sharrish-shayṭāni wa shirkih, wa an aqtarifa ʿalā nafsī sūʾan aw ajurrahu ilā Muslim.",
    translation:
      "O Allah, Knower of the unseen and the seen, Creator of the heavens and earth, Lord and Sovereign of everything, I testify that there is no deity except You. I seek refuge in You from the evil of myself, from the evil of Satan and his polytheism, and from committing wrong against myself or bringing it upon another Muslim.",
  },
  "82": {
    transliteration:
      "Bismillāhilladhī lā yaḍurru maʿasmihi shayʾun fil-arḍi wa lā fis-samāʾ, wa Huwas-Samīʿul-ʿAlīm.",
    translation:
      "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
  },
  "83": {
    transliteration:
      "Raḍītu billāhi rabban, wa bil-Islāmi dīnan, wa bi-Muḥammadin ṣallallāhu ʿalayhi wa sallama nabiyyan.",
    translation:
      "I am pleased with Allah as Lord, with Islam as religion, and with Muhammad, may Allah bless him and grant him peace, as Prophet.",
  },
  "84": {
    transliteration:
      "Yā Ḥayyu yā Qayyūm, biraḥmatika astaghīth. Aṣliḥ lī shaʾnī kullah, wa lā takilnī ilā nafsī ṭarfata ʿayn.",
    translation:
      "O Ever-Living, O Sustainer, by Your mercy I seek help. Set right all of my affairs and do not leave me to myself even for the blink of an eye.",
  },
  "87": {
    transliteration: "Subḥānallāhi wa biḥamdih.",
    translation: "Glory and praise belong to Allah.",
  },
  "88": {
    transliteration:
      "Allāhumma innī aʿūdhu bika minal-kufri wal-faqr, wa aʿūdhu bika min ʿadhābil-qabr. Lā ilāha illā Ant.",
    translation:
      "O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. There is no deity except You.",
  },
  "89": {
    transliteration:
      "Allāhumma innī asʾalukal-ʿāfiyata fid-dunyā wal-ākhirah. Allāhumma innī asʾalukal-ʿafwa wal-ʿāfiyata fī dīnī wa dunyāya wa ahlī wa mālī. Allāhummastur ʿawrātī wa āmin rawʿātī. Allāhummaḥfaẓnī min bayni yadayya, wa min khalfī, wa ʿan yamīnī, wa ʿan shimālī, wa min fawqī, wa aʿūdhu biʿaẓamatika an ughtāla min taḥtī.",
    translation:
      "O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, worldly life, family, and wealth. O Allah, conceal my faults and calm my fears. O Allah, protect me from before me, behind me, on my right, on my left, and above me; and I seek refuge in Your greatness from being taken unaware from beneath me.",
  },
  "90": {
    transliteration:
      "Allāhumma Anta rabbī, lā ilāha illā Ant. Khalaqtanī wa anā ʿabduk, wa anā ʿalā ʿahdika wa waʿdika mastaṭaʿt. Aʿūdhu bika min sharri mā ṣanaʿt. Abūʾu laka biniʿmatika ʿalayya, wa abūʾu bidhanbī, faghfir lī, faʾinnahu lā yaghfirudh-dhunūba illā Ant.",
    translation:
      "O Allah, You are my Lord; there is no deity except You. You created me and I am Your servant. I uphold Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
  },
  "91": {
    transliteration:
      "Ḥasbiyallāhu lā ilāha illā Huwa, ʿalayhi tawakkaltu wa Huwa rabbul-ʿarshil-ʿaẓīm.",
    translation:
      "Allah is sufficient for me. There is no deity except Him. In Him I place my trust, and He is Lord of the Magnificent Throne.",
  },
  "92": {
    transliteration:
      "Lā ilāha illallāhu waḥdahu lā sharīka lah. Lahul-mulku wa lahul-ḥamd, wa Huwa ʿalā kulli shayʾin qadīr.",
    translation:
      "There is no deity except Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.",
  },
  "98": {
    transliteration: "Allāhumma ṣalli wa sallim ʿalā nabiyyinā Muḥammad.",
    translation: "O Allah, send prayers and peace upon our Prophet Muhammad.",
  },
  "99": {
    transliteration:
      "Allāhumma ʿāfinī fī badanī. Allāhumma ʿāfinī fī samʿī. Allāhumma ʿāfinī fī baṣarī. Lā ilāha illā Ant.",
    translation:
      "O Allah, grant health to my body. O Allah, preserve my hearing. O Allah, preserve my sight. There is no deity except You.",
  },
  "93": {
    transliteration:
      "Lā ilāha illallāhu waḥdahu lā sharīka lah. Lahul-mulku wa lahul-ḥamd, wa Huwa ʿalā kulli shayʾin qadīr.",
    translation:
      "There is no deity except Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.",
  },
  "94": {
    transliteration:
      "Subḥānallāhi wa biḥamdih, ʿadada khalqih, wa riḍā nafsih, wa zinata ʿarshih, wa midāda kalimātih.",
    translation:
      "Glory and praise belong to Allah, by the number of His creation, by His pleasure, by the weight of His Throne, and by the extent of His words.",
  },
  "95": {
    transliteration:
      "Allāhumma innī asʾaluka ʿilman nāfiʿan, wa rizqan ṭayyiban, wa ʿamalan mutaqabbalan.",
    translation:
      "O Allah, I ask You for beneficial knowledge, wholesome provision, and accepted deeds.",
  },
  "96": {
    transliteration: "Astaghfirullāha wa atūbu ilayh.",
    translation: "I seek Allah’s forgiveness and turn to Him in repentance.",
  },
  "97": {
    transliteration: "Aʿūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq.",
    translation:
      "I seek refuge in Allah’s perfect words from the evil of what He created.",
  },
};

const periodSpecific: Readonly<
  Record<string, Readonly<Record<AzkarPeriod, AzkarEnglish>>>
> = {
  "77": {
    morning: {
      transliteration:
        "Aṣbaḥnā wa aṣbaḥal-mulku lillāh, wal-ḥamdu lillāh. Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamd, wa Huwa ʿalā kulli shayʾin qadīr. Rabbi asʾaluka khayra mā fī hādhal-yawmi wa khayra mā baʿdah, wa aʿūdhu bika min sharri mā fī hādhal-yawmi wa sharri mā baʿdah. Rabbi aʿūdhu bika minal-kasali wa sūʾil-kibar. Rabbi aʿūdhu bika min ʿadhābin fin-nāri wa ʿadhābin fil-qabr.",
      translation:
        "We have entered the morning and all dominion belongs to Allah, and all praise is for Allah. There is no deity except Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things. My Lord, I ask You for the good of this day and what follows it, and I seek refuge in You from the evil of this day and what follows it. My Lord, I seek refuge in You from laziness and the evils of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.",
    },
    evening: {
      transliteration:
        "Amsaynā wa amsal-mulku lillāh, wal-ḥamdu lillāh. Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamd, wa Huwa ʿalā kulli shayʾin qadīr. Rabbi asʾaluka khayra mā fī hādhihil-laylati wa khayra mā baʿdahā, wa aʿūdhu bika min sharri mā fī hādhihil-laylati wa sharri mā baʿdahā. Rabbi aʿūdhu bika minal-kasali wa sūʾil-kibar. Rabbi aʿūdhu bika min ʿadhābin fin-nāri wa ʿadhābin fil-qabr.",
      translation:
        "We have entered the evening and all dominion belongs to Allah, and all praise is for Allah. There is no deity except Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things. My Lord, I ask You for the good of this night and what follows it, and I seek refuge in You from the evil of this night and what follows it. My Lord, I seek refuge in You from laziness and the evils of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.",
    },
  },
  "78": {
    morning: {
      transliteration:
        "Allāhumma bika aṣbaḥnā, wa bika amsaynā, wa bika naḥyā, wa bika namūt, wa ilaykan-nushūr.",
      translation:
        "O Allah, by You we enter the morning and by You we enter the evening; by You we live and by You we die, and to You is the resurrection.",
    },
    evening: {
      transliteration:
        "Allāhumma bika amsaynā, wa bika aṣbaḥnā, wa bika naḥyā, wa bika namūt, wa ilaykal-maṣīr.",
      translation:
        "O Allah, by You we enter the evening and by You we enter the morning; by You we live and by You we die, and to You is the final return.",
    },
  },
  "80": {
    morning: {
      transliteration:
        "Allāhumma innī aṣbaḥtu ushhiduk, wa ushhidu ḥamalata ʿarshik, wa malāʾikatak, wa jamīʿa khalqik, annaka Antallāhu lā ilāha illā Ant, waḥdaka lā sharīka lak, wa anna Muḥammadan ʿabduka wa rasūluk.",
      translation:
        "O Allah, this morning I call You, the bearers of Your Throne, Your angels, and all Your creation to witness that You are Allah; there is no deity except You alone, without partner, and that Muhammad is Your servant and Messenger.",
    },
    evening: {
      transliteration:
        "Allāhumma innī amsaytu ushhiduk, wa ushhidu ḥamalata ʿarshik, wa malāʾikatak, wa jamīʿa khalqik, annaka Antallāhu lā ilāha illā Ant, waḥdaka lā sharīka lak, wa anna Muḥammadan ʿabduka wa rasūluk.",
      translation:
        "O Allah, this evening I call You, the bearers of Your Throne, Your angels, and all Your creation to witness that You are Allah; there is no deity except You alone, without partner, and that Muhammad is Your servant and Messenger.",
    },
  },
  "81": {
    morning: {
      transliteration:
        "Allāhumma mā aṣbaḥa bī min niʿmatin aw biʾaḥadin min khalqik, faminka waḥdaka lā sharīka lak, falakal-ḥamdu wa lakash-shukr.",
      translation:
        "O Allah, whatever blessing I or any of Your creation have received this morning is from You alone, without partner. To You belongs all praise and all thanks.",
    },
    evening: {
      transliteration:
        "Allāhumma mā amsā bī min niʿmatin aw biʾaḥadin min khalqik, faminka waḥdaka lā sharīka lak, falakal-ḥamdu wa lakash-shukr.",
      translation:
        "O Allah, whatever blessing I or any of Your creation have received this evening is from You alone, without partner. To You belongs all praise and all thanks.",
    },
  },
  "85": {
    morning: {
      transliteration:
        "Aṣbaḥnā wa aṣbaḥal-mulku lillāhi rabbil-ʿālamīn. Allāhumma innī asʾaluka khayra hādhal-yawm: fatḥahu, wa naṣrahu, wa nūrahu, wa barakatahu, wa hudāh; wa aʿūdhu bika min sharri mā fīhi wa sharri mā baʿdah.",
      translation:
        "We have entered the morning and all dominion belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day: its openings, victory, light, blessing, and guidance; and I seek refuge in You from its evil and the evil that follows it.",
    },
    evening: {
      transliteration:
        "Amsaynā wa amsal-mulku lillāhi rabbil-ʿālamīn. Allāhumma innī asʾaluka khayra hādhihil-laylah: fatḥahā, wa naṣrahā, wa nūrahā, wa barakatahā, wa hudāhā; wa aʿūdhu bika min sharri mā fīhā wa sharri mā baʿdahā.",
      translation:
        "We have entered the evening and all dominion belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this night: its openings, victory, light, blessing, and guidance; and I seek refuge in You from its evil and the evil that follows it.",
    },
  },
  "86": {
    morning: {
      transliteration:
        "Aṣbaḥnā ʿalā fiṭratil-Islām, wa ʿalā kalimatil-ikhlāṣ, wa ʿalā dīni nabiyyinā Muḥammadin ṣallallāhu ʿalayhi wa sallam, wa ʿalā millati abīnā Ibrāhīma ḥanīfan Musliman wa mā kāna minal-mushrikīn.",
      translation:
        "We have entered the morning upon the natural way of Islam, the word of sincere faith, the religion of our Prophet Muhammad, may Allah bless him and grant him peace, and the way of our father Abraham, upright and Muslim, who was not among those who associate partners with Allah.",
    },
    evening: {
      transliteration:
        "Amsaynā ʿalā fiṭratil-Islām, wa ʿalā kalimatil-ikhlāṣ, wa ʿalā dīni nabiyyinā Muḥammadin ṣallallāhu ʿalayhi wa sallam, wa ʿalā millati abīnā Ibrāhīma ḥanīfan Musliman wa mā kāna minal-mushrikīn.",
      translation:
        "We have entered the evening upon the natural way of Islam, the word of sincere faith, the religion of our Prophet Muhammad, may Allah bless him and grant him peace, and the way of our father Abraham, upright and Muslim, who was not among those who associate partners with Allah.",
    },
  },
};

export function getAzkarEnglish(
  reference: string,
  period: AzkarPeriod,
): AzkarEnglish {
  const number = reference.replace("Hisn al-Muslim ", "");
  const content = periodSpecific[number]?.[period] ?? shared[number];
  if (content === undefined) {
    throw new Error(
      `Missing English azkar content for ${reference} (${period})`,
    );
  }
  return content;
}
