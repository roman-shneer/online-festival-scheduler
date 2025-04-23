jQuery(document).ready(function () {
    const e = React.createElement;

    function renderCountry(country) {
        if (country == null) {
            return null;
        }
        return country.split('&').map(c => e('img', { src: `${HD.plugin_url}/images/flags/${c.trim()}.svg`, alt: c, title: c, className: 'hd-lector-flag' }));
    }

    function closePopup() {
        document.querySelector('body').removeChild(document.querySelector('#hd-lector-popup'));
    }

    function renderShortLections(lectionTitle) {
        return e('div', { className: 'hd-lection-row' }, [
            e('div', { className: 'hd-lection-title' }, lectionTitle),
        ]);
    }

    function PopupLector(props) {

        React.useEffect(() => {
            const container = document.querySelector('#hd-lector-popup');
            const rect = container.getBoundingClientRect();
            container.style.left = ((window.innerWidth - rect.width) / 2) + 'px';
            return () => {

            };
        }, []);


        const uniqueLections = props.lections
            .map(s => s.title)
            .filter((value, index, array) => array.indexOf(value) === index);

        return e('div', { className: 'hd-lector-popup-layer' },
            e('div', { className: 'hd-lector-popup-div' }, [
                e('div', { className: 'hd-lector-popup-close', onClick: closePopup }),
                e('div', { className: 'hd-lector-table' }, [
                    e('div', { className: 'hd-lector-td1' }, props.image.length > 0 && e('img', { src: props.image, class: 'hd-lector-image' })),
                    e('div', { className: 'hd-lector-td2' }, [
                        e('div', { className: 'hd-lector-name' }, props.name),
                        e('div', { className: 'hd-lector-type' }, [renderCountry(props.country), props.type]),
                    ]),

                ]),
                e('div', { className: 'hd-lections-box' }, uniqueLections.map((lection) => renderShortLections(lection))),
                e('div', { className: 'hd-dashed-border' }),
                e('div', { className: 'hd-lector-description-box' }, e('div', { dangerouslySetInnerHTML: { __html: props.description }, className: 'hp-lector-description' }, null))

            ])
        );
    }



    function getLector(id) {
        jQuery.ajax({
            type: 'POST',
            url: HD.ajaxurl,
            data: {
                id: id,
                action: 'hp_team',
                nonce: HD.nonce
            },
            success: (response) => {
                if (document.querySelector('#hd-lector-popup') != null) {
                    closePopup();
                }
                response = JSON.parse(response);


                const container = document.createElement('div');
                container.id = 'hd-lector-popup';

                const isMobile = (window.innerWidth > 1200 || window.innerHeight > 1200) == false;
                const correction = (isMobile ? -50 : 20);

                container.style.top = (window.scrollY + correction) + 'px';
                container.style.left = '20vw';


                document.querySelector('body').append(container);

                const root = ReactDOM.createRoot(container);
                root.render(e(PopupLector, response, null), container);

            }
        });
    }


    window.addEventListener("get_lector", (evt) => {
        getLector(evt.detail);
    });
});