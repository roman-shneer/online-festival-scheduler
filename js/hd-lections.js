jQuery(document).ready(function () {
    function getVersion() {
        return (window.innerWidth < 1200 || window.innerHeight < 600) ? 'mobile' : 'desktop';
    }

    function hdLections(props) {
        if (typeof props == 'undefined') {
            return null;
        }
        const [activeDay, setActiveDay] = React.useState(0);
        const [activeSpace, setActiveSpace] = React.useState(0);
        const [view, setView] = React.useState(getVersion());
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        React.useEffect(() => {
            const newView = getVersion();
            if (view != newView) {
                setView(newView);
            }

            window.addEventListener('resize', () => {
                setView(getVersion());
            });

            return () => {

            };
        }, []);

        function selectTab(evt) {
            setActiveDay(evt.target.closest('.hd-tabs-li').dataset.id);
        }


        function renderMobileDays() {
            if (view == 'desktop') {
                return null;
            }
            const renderOneDay = (i, maxI) => {
                return [
                    e('div', { className: 'hd-tabs-li ' + (i == activeDay ? 'hd-tabs-active' : ''), onClick: selectTab, 'data-id': i }, [
                        e('span', {}, [`day `, e('b', null, i + 1)]),
                    ]),
                    i != (maxI - 1) ? e('div', { className: 'hd-tabs-li-mobile-spacer' }) : null
                ];
            };

            const renderDayDescription = (d, i) => {
                return e('div', { className: 'hd-tab-description-mob ' + (i == activeDay ? 'display-block' : '') }, [
                    e('div', {}, `${d.day} ${d.month}. ${weekdays[d.weekDay]}`),
                    e('b', {}, d.title)
                ]);
            };

            return e('div', { className: 'hd-padding-left-5 hd-padding-right-5' }, [e('div', { className: 'hd-tabs' }, props.days.map((d, i) => renderOneDay(i, props.days.length))),
            e('div', {}, props.days.map((d, i) => renderDayDescription(d, i)))
            ]);
        }

        function renderDays() {
            if (view == 'mobile') {
                return null;
            }
            const renderOneDay = (d, i) => {

                return e('div', { className: 'hd-tabs-li ' + (i == activeDay ? 'hd-tabs-active' : ''), onClick: selectTab, 'data-id': i }, [
                    e('div', { className: 'hd-tabs-li-header' }, [
                        e('span', null, `Day ${i + 1} / ${d.day} ${d.month}.`),
                        e('span', { style: { float: 'right', marginLeft: '20px' } }, weekdays[d.weekDay].toUpperCase())
                    ]),
                    e('div', { className: 'hd-tabs-li-title' }, d.title)
                ]);
            }

            return e('div', { className: 'hd-tabs' }, props.days.map((d, i) => renderOneDay(d, i)));
        }





        function renderLector(lectorId) {
            const registerLectorIds = Object.keys(props.lectors);
            const lectorIds = lectorId.split(',').filter(id => registerLectorIds.includes(id));
            const lectors = [];
            lectorIds.forEach((lId, i) => {
                if (typeof props.lectors[lId] != 'undefined') {
                    lectors.push(e('span', {
                        className: 'hd-lector-link', onClick: () => {
                            const event = new CustomEvent("get_lector", { detail: lId });
                            window.dispatchEvent(event);
                        }
                    }, props.lectors[lId].post_title));

                    if ((i + 1) < lectorIds.length) {
                        lectors.push(' & ');
                    }
                }
            });

            return e('span', { className: 'hd-lector-authors' }, lectors);


        }

        function renderZoomIcon(zoomUrl) {
            zoomUrl = zoomUrl.trim();
            if (zoomUrl.length == 0 || props.responseToken.length == 0) {
                return null;
            }
            return e('a', { href: zoomUrl, title: 'Zoom Meeting', 'target': '_blank' }, e('img', { src: `${HD.plugin_url}/images/zoom.png`, 'width': '30' }));
        }

        function getLiveClass(item) {
            if (props.timenow >= item.secRange[0] && props.timenow <= item.secRange[1]) {
                return 'hd-lection-live';
            }

            return '';
        }

        function renderTable() {
            const lections = props.lections.filter(s => s.startTime.substr(0, 10) == props.days[activeDay].date);
            const rows = {};
            lections.forEach(lection => {
                const startTimeKey = lection.startTimeSeconds;
                if (typeof rows[startTimeKey] == 'undefined') {
                    rows[startTimeKey] = { lections: {}, timeRange: lection.startTime.substr(11, 5) + ' - ' + lection.endTime.substr(11, 5), secRange: [lection.startTimeSeconds, lection.endTimeSeconds] };
                }
                const space = lection.space.length > 0 ? lection.space : 0;

                rows[startTimeKey].lections[space] = lection;
            });
            const rowKeys = Object.keys(rows).sort();

            if (view == 'mobile') {

                function renderMobileTime(times) {
                    const elements = [];
                    times.split('-').forEach((t) => {
                        elements.push(e('div', null, t.trim()));
                    });
                    return elements;
                }

                function checkTimeVisibility(lections) {
                    const spaceId = props.spaces[activeSpace].id;
                    const array = Object.keys(lections).map(k => lections[k]);
                    const filtered = array.filter(s => s.space == '' || s.space.toString() == spaceId.toString());
                    return filtered.length > 0;
                }

                return e('table', { className: 'hd-lections-table', border: 1 },
                    e('tbody', null, [
                        e('tr', {}, [
                            e('th', { colspan: props.spaces.length, className: 'hd-lection-spaces-mob-th hd-padding-left-2' }, e('div', { className: 'hd-lection-spaces-mob-div' },
                                props.spaces.map((space, sId) => [e('span', {
                                    className: 'hd-space-title ' + (sId == activeSpace ? 'hd-space-active' : ''), onClick: (evt) => {
                                        setActiveSpace(evt.target.dataset.spaceid);
                                    }, 'data-spaceid': sId
                                }, space.title),
                                sId != (props.spaces.length - 1) ? e('div', { className: 'hd-tabs-li-mobile-spacer' }) : null
                                ]
                                )
                            )),

                        ]),
                        rowKeys.map(time => (checkTimeVisibility(rows[time].lections)) ? e('tr', null, [
                            e('td', {}, e('span', null, renderMobileTime(rows[time].timeRange))),
                            typeof rows[time].lections[0] != 'undefined' ?
                                e('td', { className: 'hd-center' }, e('div', {}, e('span', null, [rows[time].lections[0].title, renderZoomIcon(rows[time].lections[0].zoom_url)]))) :
                                props.spaces.map((space, sId) => e('td', { className: 'hd-border-bottom ' + (sId == activeSpace ? 'hd-space-visible' : 'hd-space-hidden') },
                                    typeof rows[time].lections[space.id] != 'undefined' ? [rows[time].lections[space.id].title, renderLector(rows[time].lections[space.id].lectorId), renderZoomIcon(rows[time].lections[space.id].zoom_url)] : ''
                                )),
                        ]) : null
                        )
                    ])
                );
            } else {
                return e('table', { className: 'hd-lections-table', border: 1 },
                    e('tbody', null, [
                        e('tr', {}, [
                            e('td', null, ''),
                            props.spaces.map(space => e('td', { className: 'hd-space-title' }, space.title))
                        ]),
                        rowKeys.map(time => e('tr', { className: getLiveClass(rows[time]) }, [
                            e('td', { className: 'hd-border-top-bottom' }, e('span', null, rows[time].timeRange)),
                            typeof rows[time].lections[0] != 'undefined' ? e('td', { colspan: props.spaces.length + 1 }, e('div', { className: 'hd-center' }, [
                                rows[time].lections[0].title,
                                renderLector(rows[time].lections[0].lectorId),
                                renderZoomIcon(rows[time].lections[0].zoom_url)
                            ])) :
                                props.spaces.map(space => e('td', { className: 'hd-border-bottom' }, e('div', {}, typeof rows[time].lections[space.id] != 'undefined' ? [
                                    rows[time].lections[space.id].title,
                                    renderLector(rows[time].lections[space.id].lectorId),
                                    renderZoomIcon(rows[time].lections[space.id].zoom_url)
                                ] : ''))),
                        ]))
                    ])
                );
            }
        }
        return e('div', { className: 'hd-program-container' }, [
            e('div', { className: 'hd-space-top-center' }, [
                e('h1', { className: 'hd-space-title-main' }, 'Festival Program'),
                e('div', {}, [
                    renderMobileDays(),
                    renderDays(),

                    renderTable(),
                    e('center', { style: { color: 'gray', fontSize: '90%' } }, "The schedule follows UTC time")
                ]),
            ]),
        ]);

    }
    const e = React.createElement;
    const container = document.getElementById('hd-program');

    const parsedUrl = new URL(window.location.href);
    const token = parsedUrl.searchParams.get('token');

    if (container != null) {
        jQuery.ajax({
            type: 'POST',
            url: HD.ajaxurl,
            data: {
                action: 'hp_program_festival',
                nonce: HD.nonce,
                token: token
            },
            success: (response) => {
                response = JSON.parse(response);
                if (typeof response.error == 'undefined') {
                    const root = ReactDOM.createRoot(container);
                    root.render(e(hdLections, response, null));
                }
            }
        });
    }


});