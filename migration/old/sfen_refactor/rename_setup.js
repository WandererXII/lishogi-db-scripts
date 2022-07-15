db.study_chapter_flat.updateMany({}, { $rename: { "setup.fromKif": "setup.fromNotation" } });
