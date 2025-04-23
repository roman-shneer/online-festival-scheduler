jQuery(document).ready(function () {

    class InstallFestivalsPlugin extends React.Component {
        state = {
            loading: false,
            message: null,
        }

        post(action, data, callback) {
            this.state.loading = true;
            this.setState(this.state);
            console.log(HD);
            jQuery.ajax({
                type: 'POST',
                url: HD.ajaxurl,
                data: {
                    data: data,
                    action: action,
                    nonce: HD.nonce
                },
                success: (response) => {
                    this.state.loading = false;
                    this.setState(this.state);
                    callback(JSON.parse(response));
                }
            });
        }

        renderLoading() {
            return this.state.loading ? e('div', { className: 'hd-loading' }, 'wait...') : null;
        }

        renderWrong() {
            return this.state.message != null ? e('div', { className: 'hd-loading' }, this.state.message) : null;
        }

        installTables() {
            console.log('installTables');

            this.post('hp_lection_install_tables', {

            }, (response) => {
                if (response.result) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000)
                    this.state.message = "Tables created! Refreshing...";
                    this.setState(this.state);


                } else {
                    this.state.message = "Something wrong!";
                    this.setState(this.state);
                }
            });
        }

        render() {
            return e('div', null, [
                this.renderLoading(),
                this.renderWrong(),
                e('h2', null, "DB tables for pluggin missing"),
                e('button', { onClick: () => this.installTables() }, "Install MySql Tables")
            ]);
        }
    }


    class StartFestivalForm extends React.Component {
        state = {
            'festivalId': 0,
            'dateStart': null,
            'dateEnd': null,
            'days': [],
            'spaces': [],
            'spacesCount': 0,

            'showFestivals': true,
            'formStart': false,
            'formDays': false,
            'formLections': false,

            'lectorsAutocomplete': [],
            'lectorSelected': '',
            'lection': null,
            'festivals': [],

            'loading': false
        };

        constructor() {
            super();


        }

        componentDidMount() {

            this.reloadFestivals();
        }

        reloadFestivals() {

            this.post('hp_lection_get', {}, (response) => {
                if (response) {
                    this.setState({ festivals: response });

                }
            });

        }

        showNewForm() {
            this.setState({ formStart: true });
        }

        updateField = (e) => {
            if (typeof e.target.dataset.subname != 'undefined') {

                this.state[e.target.dataset.subname][e.target.dataset.field] = e.target.value;
            } else {
                this.state[e.target.dataset.field] = e.target.value;
            }

            if (['dateStart', 'dateEnd'].includes(e.target.dataset.field) && this.state.dateStart != null && this.state.dateEnd != null) {

                const startTime = new Date(this.state.dateStart).getTime() / 1000;
                const endTime = new Date(this.state.dateEnd).getTime() / 1000;
                const daysLength = ((endTime - startTime) / (3600 * 24)) + 1;
                const dateCreated = [];
                for (let d = 0; d < daysLength; d++) {

                    let date = this.timeToDate((startTime + (3600 * 24 * d)));
                    date = this.convertToDateFormat(date);
                    if (this.state.days.filter(d => d.date == date).length == 0) {
                        dateCreated.push(date);
                        this.state.days.push({
                            date: date,
                            title: '',
                            //lections:[]
                        });
                    }


                }
                this.state.days = this.state.days.filter(d => dateCreated.includes(d.date));
            }

            for (let i = 0; i < this.state.spacesCount; i++) {
                if (typeof this.state.spaces[i] == 'undefined') {
                    this.state.spaces[i] = {
                        title: '',
                        description: '',
                        image: '',
                        question: '',
                        answer: ''
                    };
                }
            }
            this.setState(this.state);

        };




        formStart() {



            const updateSpaceField = (e) => {
                if (typeof this.state.spaces[e.target.dataset.id] == 'undefined') {
                    this.state.spaces[e.target.dataset.id] = {
                        title: '',
                        description: '',
                        image: '',
                        question: '',
                        answer: ''
                    };
                }
                this.state.spaces[e.target.dataset.id][e.target.dataset.field] = e.target.value;
                this.setState(this.state);

            };

            const saveSpace = () => {

                this.post('hp_lection_spaces_save', {
                    spaces: this.state.spaces,
                    festivalId: this.state.festivalId,
                    token: this.state.token
                }, (response) => {
                    this.state.festivalId = response.festivalId;
                    this.state.lections = response.lections;
                    this.state.spacesSaved = response.spaces;
                    this.state.lectors = response.lectors;
                    this.state.formStart = false;
                    this.state.formDays = true;

                    this.setState(this.state);
                });

            }



            let spacesForm = []
            if (this.state.spacesCount > 0) {
                for (let i = 0; i < this.state.spacesCount; i++) {

                    spacesForm.push(
                        e('div', { className: 'hp-admin-inline-block margin-right-1' },
                            e('table', { className: 'hd-collapse', border: 1 }, [
                                e('tr', null, [
                                    e('th', { colspan: 2 }, `Space ${i + 1}`),

                                ]),
                                e('tr', null, [
                                    e('td', null, e('label', { className: 'hd-admin-label' }, 'Title')),
                                    e('td', null, e('input', { className: 'hd-admin-input', type: 'text', defaultValue: this.state.spaces[i].title, 'data-field': 'title', 'data-id': i, onChange: updateSpaceField })),
                                ]),
                                e('tr', null, [
                                    e('td', null, e('label', { className: 'hd-admin-label' }, 'Description')),
                                    e('td', null, e('textarea', { className: 'hd-admin-input', defaultValue: this.state.spaces[i].description, 'data-field': 'description', 'data-id': i, onChange: updateSpaceField })),
                                ]),
                                e('tr', null, [
                                    e('td', null, e('label', { className: 'hd-admin-label' }, 'Image URL')),
                                    e('td', null, e('input', { className: 'hd-admin-input', type: 'text', defaultValue: this.state.spaces[i].image, 'data-field': 'image', 'data-id': i, onChange: updateSpaceField })),
                                ]),
                                e('tr', null, [
                                    e('td', null, e('label', { className: 'hd-admin-label' }, 'Question')),
                                    e('td', null, e('textarea', { className: 'hd-admin-input', defaultValue: this.state.spaces[i].question, 'data-field': 'question', 'data-id': i, onChange: updateSpaceField })),
                                ]),
                                e('tr', null, [
                                    e('td', null, e('label', { className: 'hd-admin-label' }, 'Answer')),
                                    e('td', null, e('textarea', { className: 'hd-admin-input', defaultValue: this.state.spaces[i].answer, 'data-field': 'answer', 'data-id': i, onChange: updateSpaceField })),
                                ]),

                            ])
                        )
                    );
                }

                spacesForm.push(e('div', null, e('button', { onClick: saveSpace }, 'Save'), e('button', {
                    onClick: () => {
                        this.closeAll();
                    }
                }, 'Close')));
            }

            return e('div', null,
                e('table', null,
                    e('tr', null, [
                        e('td', null, e('b', null, 'How many spaces:')),
                        e('td', null, e('input', { type: 'number', max: 2, onChange: this.updateField, 'data-field': 'spacesCount', 'defaultValue': this.state.spacesCount })),
                    ]),

                    this.state.spacesCount > 0 ? null : e('tr', null, [
                        e('td', null, e('button', {
                            onClick: () => { this.closeAll() }
                        }, 'close')),
                    ]),
                    e('tr', null, [
                        e('td', { style: { verticalAlign: 'top' } }, [
                            e('b', null, 'Passwords'),
                            e('div', null, e('i', null, 'every password should be on new row')),
                            e('div', null, e('i', null, 'please use only latin letters and numbers'))

                        ]),
                        e('td', null,
                            e('textarea', {
                                defaultValue: this.state.token,
                                rows: 5,
                                cols: 40,
                                onChange: this.updateField,
                                'data-field': 'token'
                            })
                        )
                    ])
                ),
                e('div', null, spacesForm)
            );
        }

        closeAll() {
            this.setState({
                formLections: false,
                formDays: false,
                spacesCount: 0,
                spaces: [],
                showFestivals: true,
                formStart: false
            });
        }

        dateTimeToDate(datetime) {

            if (typeof datetime == 'undefined') {
                return null;
            }
            return datetime.substr(0, 10);

        }

        timeToDate(seconds) {
            const miliseconds = seconds * 1000;
            const thisDate = new Date(miliseconds);
            let d = thisDate.getDate().toString();

            if (d.length < 2) {
                d = `0${d}`;
            }
            let m = (thisDate.getMonth() + 1).toString();
            if (m.length < 2) {
                m = `0${m}`;
            }

            let y = thisDate.getFullYear();
            return `${d}/${m}/${y}`;
        }

        convertToDateFormat(string) {
            const d = string.split('/');
            return `${d[2]}-${d[1]}-${d[0]}`;
        }


        resetLection(data = {}) {

            const defaultValues = {
                title: '',
                id: 0,
                date: '',
                startTime: '',
                endTime: '',
                space: '',
                lectors: [],
                zoomUrl: ''
            };
            Object.keys(data).forEach(k => {
                defaultValues[k] = data[k];
            });
            this.state.lection = defaultValues;
            this.setState(this.state);
        }



        formDays() {
            const addLection = (evt) => {
                this.resetLection({
                    date: evt.target.dataset.date,
                });

                this.state.formLections = true;
                this.setState(this.state);
            }


            const renderFormLection = () => {

                if (!this.state.formLections) {
                    return null;
                }


                let lectorsSelect = null;
                const autocompleteLector = (evt) => {

                    if (evt.target.value.length == 0) {
                        this.setState({ 'lectorsAutocomplete': [] });
                    } else {
                        this.setState({ 'lectorsAutocomplete': this.state.lectors.filter((lector) => lector.post_title.toLowerCase().indexOf(evt.target.value.toLowerCase()) > -1) })
                    }

                };

                const selectLector = (evt) => {
                    const option = evt.target.parentNode.querySelector('option[value="' + evt.target.value + '"]');
                    this.state.lection.lectors.push({
                        id: evt.target.value,
                        name: option.innerText
                    });
                    this.state.lection.lector = {
                        id: evt.target.value,
                        name: option.innerText
                    }
                    this.state.lectorsAutocomplete = [];
                    this.state.lectorSelected = option.innerText;
                    this.setState(this.state);

                };

                const createLection = () => {
                    const lection = this.state.lection;
                    this.post('hp_lection_one_save', {
                        festivalId: this.state.festivalId,
                        title: lection.title,
                        startTime: `${lection.date} ${lection.startTime}:00`,
                        endTime: `${lection.date} ${lection.endTime}:00`,
                        lectorId: lection.lectors.map(s => s.id).join(','),
                        space: lection.space,
                        zoom_url: lection.zoomUrl,
                        id: lection.id

                    }, (response) => {
                        this.state.lections = response;
                        this.state.formLections = false;
                        this.setState(this.state);
                        this.resetLection();
                    });

                };



                if (this.state.lectorsAutocomplete.length > 0) {
                    lectorsSelect = e('select', { style: { 'display': 'block' }, multiple: true }, [
                        this.state.lectorsAutocomplete.map((lector) => e('option', { value: lector.ID, onClick: selectLector }, lector.post_title))
                    ]);

                }

                const speakerDivs = [];
                if (this.state.lection.lectors != null) {
                    this.state.lection.lectors.forEach((lector) => {

                        speakerDivs.push(e('div', { className: 'margin-bottom-1' }, [
                            e('label', null, lector.name),
                            e('button', {
                                onClick: (evt) => {

                                    this.state.lection.lectors = this.state.lection.lectors.filter(s => s.id != evt.target.dataset.id);
                                    this.setState(this.state);
                                },
                                'data-id': lector.id
                            }, 'delete')
                        ]));
                    });
                }

                speakerDivs.push(e('input', { type: 'text', className: 'hd-admin-input', 'data-field': 'lector', 'data-subname': 'lection', onKeyDown: autocompleteLector }));
                speakerDivs.push(lectorsSelect);




                return e('div', { className: 'hd-popup-form' }, [
                    e('div', { className: 'margin-bottom-1' }, [
                        e('label', { className: 'hd-admin-label' }, 'Lection Title'),
                        e('input', {
                            type: 'text',
                            className: 'hd-admin-input',
                            'data-field': 'title',
                            'data-subname': 'lection',
                            defaultValue: this.state.lection.title,
                            onChange: this.updateField
                        })
                    ]),
                    e('div', { className: 'margin-bottom-1' }, [
                        e('label', { className: 'hd-admin-label' }, 'Date'),
                        e('input', {
                            type: 'date',
                            className: 'hd-admin-input',
                            'data-field': 'date',
                            'data-subname': 'lection',
                            defaultValue: this.state.lection.date,
                            onChange: this.updateField
                        })
                    ]),
                    e('div', { className: 'margin-bottom-1' }, [
                        e('label', { className: 'hd-admin-label' }, 'Time'),
                        e('input', {
                            type: 'time',
                            className: 'hd-admin-input-half',
                            defaultValue: this.state.lection.startTime,
                            'data-field': 'startTime',
                            'data-subname': 'lection',
                            onChange: this.updateField,

                        }),
                        e('input', {
                            type: 'time',
                            className: 'hd-admin-input-half',
                            'data-field': 'endTime',
                            'data-subname': 'lection',
                            onChange: this.updateField,
                            defaultValue: this.state.lection.endTime,
                        })
                    ]),
                    e('div', { className: 'margin-bottom-1' }, [
                        e('label', { className: 'hd-admin-label' }, 'Space'),
                        e('select', {
                            onChange: this.updateField,
                            'data-field': 'space',
                            'data-subname': 'lection',
                            className: 'hd-admin-input',
                            defaultValue: this.state.lection.space
                        }, [
                            e('option', { value: '' }, '-select-'),
                            this.state.spacesSaved.map((space, s) => e('option', { value: space.id }, space.title))
                        ]),
                        e('div', { className: 'hd-note' }, 'keep blank for global event')

                    ]),
                    e('div', { className: 'margin-bottom-1' }, [
                        e('label', { className: 'hd-admin-label' }, 'Speaker'),
                        e('div', { className: 'hd-admin-input' }, speakerDivs),

                    ]),
                    e('div', { className: 'margin-bottom-1' }, [
                        e('label', { className: 'hd-admin-label' }, 'Zoom URL'),
                        e('div', { className: 'hd-admin-input' },
                            e('input',
                                {
                                    type: "url",
                                    defaultValue: this.state.lection.zoomUrl,
                                    className: 'hd-admin-input',
                                    'data-field': 'zoomUrl',
                                    'data-subname': 'lection',
                                    onChange: this.updateField
                                })
                        ),

                    ]),
                    e('div', null, [
                        e('button', { onClick: createLection }, 'Save Lection'),
                        e('button', {
                            style: { float: 'right' },
                            onClick: () => {
                                this.setState({
                                    formLections: false
                                });
                            }
                        }, 'Close'),

                    ]),
                ]);

            };
            const addDayTitle = (evt) => {
                this.state.days[evt.target.dataset.id].title = evt.target.value;
                this.setState(this.state);
            };


            const daysContent = [];

            if (this.state.days.length > 0) {
                this.state.days.forEach((d, dId) => {

                    const dayLections = this.state.lections.filter(s => this.dateTimeToDate(s.startTime) == d.date);

                    daysContent.push(
                        e('div', null, [
                            e('h2', null, 'Day: ' + d.date),
                            e('div', null, [
                                e('label', { className: 'hd-admin-label' }, 'Day Title'),
                                e('input', { className: 'hd-admin-input', type: 'text', onChange: addDayTitle, 'data-id': dId, defaultValue: this.state.days[dId].title })
                            ]),
                            e('div', null, [
                                e('button', { onClick: (e) => addLection(e), 'data-date': d.date }, 'Add lection')
                            ]),
                        ])
                    );


                    if (dayLections.length > 0) {
                        daysContent.push(this.renderLections(dayLections));
                    }

                });
                daysContent.push(
                    e('button', {
                        onClick: () => {
                            this.closeAll();
                        }, style: { 'float': 'right' }
                    }, 'Close')
                );
                daysContent.push(
                    e('button', { onClick: this.saveFestival, style: { 'float': 'right' } }, 'Save Festival')
                );


            }

            return e('div', null, [
                e('h2', null, 'How many days'),
                e('div', { className: 'hp-admin-inline-block' }, [
                    'Festival Start',
                    e('input', { type: 'date', onChange: this.updateField, 'data-field': 'dateStart', defaultValue: this.state.dateStart })
                ]),
                e('div', { className: 'hp-admin-inline-block' }, [
                    'Festival End',
                    e('input', { type: 'date', onChange: this.updateField, 'data-field': 'dateEnd', defaultValue: this.state.dateEnd })
                ]),

                daysContent,
                renderFormLection()
            ]);
        }

        renderLections(lections) {
            if (lections.length > 0) {

                const renderLector = (lectorId) => {

                    const lectorIds = lectorId.split(",");
                    const names = [];
                    lectorIds.forEach(lId => {
                        if (lId.length > 0) {
                            const filteredLectors = this.state.lectors.filter(s => s.ID == lId);
                            if (filteredLectors.length > 0) {
                                names.push(filteredLectors[0].post_title);
                            }

                        }

                    });
                    return names.join(",");
                }

                const lectionsTrs = [
                    e('tr', null, [
                        e('td', null, 'Time'),
                        e('td', null, 'Title'),

                        e('td', null, 'Speakers'),
                        e('td', null, 'Space'),
                        e('td', null, ''),
                    ])
                ];


                const sortedByTime = lections.sort((a, b) => { return new Date(a.startTime).getTime() - new Date(b.startTime).getTime(); });
                sortedByTime.forEach((lection) => {

                    lectionsTrs.push(e('tr', null, [
                        e('td', null, `${lection.startTime.substr(10, 6)} - ${lection.endTime.substr(10, 6)}`),
                        e('td', null, lection.zoom_url.length > 0 ? e('a', { href: lection.zoom_url, target: "_blank", title: lection.zoom_url }, lection.title) : lection.title),
                        e('td', null, renderLector(lection.lectorId)),
                        e('td', null, lection.space_name),
                        e('td', null, [
                            e('button', {
                                'data-id': lection.id, onClick: (evt) => {
                                    const selectedLection = this.state.lections.filter(s => s.id == evt.target.dataset.id)[0];
                                    let lectors = [];
                                    if (selectedLection.lectorId.length > 0) {
                                        const findLectorIds = selectedLection.lectorId.split(',').map(s => s.trim());
                                        lectors = this.state.lectors.filter(s => findLectorIds.includes(s.ID)).map((s) => { return { 'id': s.ID, 'name': s.post_title }; });
                                    }
                                    this.resetLection({
                                        id: selectedLection.id,
                                        title: selectedLection.title,
                                        date: this.dateTimeToDate(selectedLection.startTime),
                                        startTime: selectedLection.startTime.substr(11, 5),
                                        endTime: selectedLection.endTime.substr(11, 5),
                                        festivalId: selectedLection.festivalId,
                                        lectors: lectors,
                                        space: selectedLection.space,
                                        zoomUrl: selectedLection.zoom_url
                                    });

                                    this.state.formLections = true;
                                    this.setState(this.state);


                                }
                            }, 'edit'),
                            e('button', {
                                'data-id': lection.id, onClick: (evt) => {
                                    if (confirm("Please confirm deletion")) {
                                        this.post('hp_lection_spaces_delete', { id: evt.target.dataset.id, festivalId: this.state.festivalId }, (response) => {
                                            this.state.lections = response;
                                            this.setState(this.state);
                                        })
                                    }
                                }
                            }, 'drop'),

                        ])
                    ]));
                });
                return e('table', { border: 1, className: 'hd-collapse' }, lectionsTrs);
            } else {
                return null;
            }
        }

        sanitizeString(string) {

            return string.replace("\'", "'");
        }

        saveFestival = () => {


            const data = {
                dateStart: this.state.dateStart,
                dateEnd: this.state.dateEnd,
                days: this.state.days,
                festivalId: this.state.festivalId
            };
            this.post('hp_lection_save', data, (response) => {
                if (response) {
                    console.log("We successfull!");
                    this.reloadFestivals();
                }
            });

        }

        loadFestival = (evt) => {

            this.post('hp_lection_spaces', { id: evt.target.dataset.id }, (response) => {

                const festival = this.state.festivals.filter(s => s.id == evt.target.dataset.id)[0];

                this.setState({
                    showFestivals: false,
                    formStart: true,
                    dateStart: festival.dateStart,
                    dateEnd: festival.dateEnd,
                    spacesCount: response.spaces.length,
                    spaces: response.spaces,
                    days: festival.days,
                    token: festival.token.join("\n"),
                    festivalId: festival.id
                });
            })


        }

        deleteFestival(evt) {
            this.post('hp_lection_delete', { id: evt.target.dataset.id }, (response) => {
                if (response) {
                    console.log("We successfull!");
                    this.reloadFestivals();
                }
            });


        }

        renderFestivals() {

            const trs = [
                e('tr', null, [
                    e('td', null, 'Start Date'),
                    e('td', null, 'End Date'),
                    e('td', null, ' '),
                ])
            ];
            this.state.festivals.forEach((fest, f) => {
                trs.push(e('tr', null, [
                    e('td', null, fest.dateStart),
                    e('td', null, fest.dateEnd),
                    e('td', null, e('button', { onClick: this.loadFestival, 'data-id': fest.id }, 'edit'), e('button', {
                        onClick: (evt) => {
                            if (confirm("Please confirm festival deletion")) {
                                this.deleteFestival(evt);
                            }
                        }, 'data-id': fest.id
                    }, 'delete')),
                ]));
            });
            return e('table', { border: 1, className: 'hd-collapse' }, trs);
        }

        renderStartButton() {
            if (!this.state.showFestivals) {
                return null;
            }
            return e('button', {
                onClick: () => {
                    this.setState({
                        festivalId: 0,
                        dateStart: null,
                        dateEnd: null,
                        days: [],
                        formStart: true,
                        showFestivals: false
                    });
                }
            }, 'Create festival');
        }

        post(action, data, callback) {
            this.state.loading = true;
            this.setState(this.state);


            jQuery.ajax({
                type: 'POST',
                url: HD.ajaxurl,
                data: {
                    data: data,
                    action: action,
                    nonce: HD.nonce
                },
                success: (response) => {
                    this.state.loading = false;
                    this.setState(this.state);
                    callback(JSON.parse(response));
                }
            });
        }

        renderLoading() {
            return this.state.loading ? e('div', { className: 'hd-loading' }, 'wait...') : null;
        }

        render() {

            const forms = [
                this.renderLoading(),
                this.renderStartButton(),
                this.state.showFestivals && this.renderFestivals(),
                this.state.formStart && this.formStart(),
                this.state.formDays && this.formDays(),
                e('div', null,'Add to homepage empty element with id="hd-program".')
            ];
            return forms;

        }
    }

    const container = document.getElementById('js-hd-festival-form');
    const e = React.createElement;
    if (container != null) {
        const root = ReactDOM.createRoot(document.getElementById('js-hd-festival-form'));
        if (container.dataset.status == 1) {
            root.render(e(StartFestivalForm, {}, null,));
        } else {
            root.render(e(InstallFestivalsPlugin, {}, null,));
        }

    }


});
