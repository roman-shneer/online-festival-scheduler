<?php

date_default_timezone_set('Europe/Ljubljana');
/**
 * The plugin customization for human design
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @since             1.0.0
 * @package           online-festival-scheduler
 *
 * @wordpress-plugin
 * Plugin Name:       Online Festival Scheduler
 * Description:       Represent lections per days, space. In active time, shows link to zoom for users with password
 * Version:           1.0.0
 * Author:            romanshneer@gmail.com
 */
class OnlineFestivalScheduler
{
    private $wpdb = null;
    private $current_page = 'hd-lections-admin-forms';
    private $tables = [
        'festivals' => 'onfest_festivals',
        'festival_spaces' => 'onfest_festival_spaces',
        'festival_lections' => 'onfest_festival_lections'
    ];
    const ID = 'hd-lections-admin-forms';

    public function __construct($wpdb)
    {
        $this->wpdb = $wpdb;

        add_action('admin_menu', [$this, 'add_menu_page'], 20);
        add_action('admin_enqueue_scripts', [$this, 'my_enqueue_admin']);
        add_action('wp_enqueue_scripts', [$this, 'my_enqueue_site']);

        add_action('wp_ajax_hp_lection_install_tables', [$this, 'hp_lection_install_tables_callback']);
        add_action('wp_ajax_hp_program_festival', [$this, 'hp_program_festival_callback']);
        add_action('wp_ajax_nopriv_hp_program_festival', [$this, 'hp_program_festival_callback']);

        add_action('wp_ajax_hp_team', [$this, 'hp_team_callback']);
        add_action('wp_ajax_nopriv_hp_team', [$this, 'hp_team_callback']);

        add_action('wp_ajax_hp_festival_spaces', [$this, 'hp_festival_spaces_callback']);
        add_action('wp_ajax_nopriv_hp_festival_spaces', [$this, 'hp_festival_spaces_callback']);



        add_action('wp_ajax_hp_lection_get', [$this, 'hp_lection_get_callback']);
        add_action('wp_ajax_hp_lection_save', [$this, 'hp_lection_save_callback']);
        add_action('wp_ajax_hp_lection_one_save', [$this, 'hp_lection_one_save_callback']);
        add_action('wp_ajax_hp_lection_delete', [$this, 'hp_lection_delete_callback']);
        add_action('wp_ajax_hp_lection_spaces_save', [$this, 'hp_lection_spaces_save_callback']);
        add_action('wp_ajax_hp_lection_spaces', [$this, 'hp_lection_spaces_callback']);
        add_action('wp_ajax_hp_lection_spaces_delete', [$this, 'hp_lection_spaces_delete_callback']);
    }


    //install mysql tables if missing
    public function hp_lection_install_tables_callback()
    {
        $charset_collate = $this->wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $sql1 = "CREATE TABLE IF NOT EXISTS {$this->table('festivals')} (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `dateStart` date NOT NULL,
            `dateEnd` date NOT NULL,
            `data` text NOT NULL,
             PRIMARY KEY (id)
        ) $charset_collate";
        dbDelta($sql1);

        $sql2 = "CREATE TABLE IF NOT EXISTS {$this->table('festival_spaces')} (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `festivalId` int(11) NOT NULL,
            `title` varchar(100) NOT NULL,
            `description` text NOT NULL,
            `image` varchar(200) NOT NULL,
            `question` text NOT NULL,
            `answer` text NOT NULL,
             PRIMARY KEY (id)
        ) $charset_collate";
        dbDelta($sql2);

        $sql3 = "CREATE TABLE IF NOT EXISTS {$this->table('festival_lections')} (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `title` varchar(200) NOT NULL,
            `festivalId` int(11) NOT NULL,
            `lectorId` varchar(20) NOT NULL,
            `startTime` datetime NOT NULL,
            `endTime` datetime NOT NULL,
            `space` varchar(100) NOT NULL,
            `zoom_url` varchar(512) NOT NULL,
             PRIMARY KEY (id)
            ) $charset_collate";
        dbDelta($sql3);

        die(json_encode(['result' => $this->check_if_tables_created()]));
    }

    
    //api loading spaces -- used by another module hd-lections
    public function hp_festival_spaces_callback()
    {

        $festivals = $this->wpdb->get_results($this->wpdb->prepare("SELECT f.id,f.data FROM {$this->table('festivals')} f WHERE dateStart>%s ORDER BY dateStart ASC LIMIT 1", [date('Y-m-d H:i:s')]));
        if (count($festivals) == 0) {
            //take last festival
            $festivals = $this->wpdb->get_results($this->wpdb->prepare("SELECT f.id,f.data FROM {$this->table('festivals')} f  ORDER BY dateStart ASC LIMIT 1", [date('Y-m-d H:i:s')]));
        }
        $spaces = $this->wpdb->get_results($this->wpdb->prepare("SELECT * FROM {$this->table('festival_spaces')} WHERE festivalId=%s", [$festivals[0]->id]));
        die(json_encode(['spaces' => $spaces]));
    }

    //return full path of image
    private function getThumbnail($value)
    {
        if ($value === false) {
            return '';
        }
        $imageUrlParts = explode("/", $value['file']);

        $imageUrlParts[count($imageUrlParts) - 1] = $value['sizes']['thumbnail']['file'];
        $imageUrl = get_site_url() . "/wp-content/uploads/" . implode('/', $imageUrlParts);
        return  $imageUrl;
    }

    private function getInfo($infoItems)
    {
        $info = [];
        foreach ($infoItems as $item) {
            $info[$item['name']] = $item['description'];
        }
        return $info;
    }


    //api return team member
    public function hp_team_callback()
    {
        $lector = get_post($_POST['id'], OBJECT, 'raw');

        $metas = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table('postmeta')} WHERE post_id=%d AND meta_key IN ('_thumbnail_id','info_items')",
                [$lector->ID]
            ),
            OBJECT
        );
        $meta = [];
        foreach ($metas as $m) {
            $meta[$m->meta_key] = $m->meta_value;
        }

        $attachments = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT meta_value
            FROM  {$this->table('postmeta')} m 
            WHERE m.post_id=%d
            AND m.meta_key='_wp_attachment_metadata'
            LIMIT 1",
                [$meta['_thumbnail_id']]
            ),
            OBJECT
        );

        $imageUrl = $this->getThumbnail(unserialize($attachments[0]->meta_value));
        $info = $this->getInfo(unserialize($meta['info_items']));
        $festivals = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT f.id,f.dateStart
                FROM {$this->table('festivals')} f             
                WHERE f.dateStart>%s ORDER BY dateStart ASC LIMIT 1",
                [date('Y-m-d H:i:s')]
            )
        );


        $lections = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT l.startTime,l.endTime,l.title,s.title as spaceTitle 
                FROM {$this->table('festival_lections')} l  
                LEFT JOIN {$this->table('festival_spaces')} s ON FIND_IN_SET(s.id, l.space)
                WHERE l.festivalId=%d  AND lectorId=%d
                ORDER BY l.startTime;",
                [$festivals[0]->id, $_POST['id']]
            )
        );
        WPBMap::addAllMappedShortcodes();
        $html = do_shortcode($lector->post_content, true);
        if ($html == $lector->post_content) {
            $html = nl2br($html);
        }
        die(json_encode([
            'image' => $imageUrl,
            'name' => $lector->post_title,
            'type' => $info['Type'],
            'country' => $info['Country'],
            'description' => $html,
            'lections' => $lections
        ]));
    }


    private function getLections($festivalId)
    {
        $lections = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT l.*, s.title as space_name 
                FROM {$this->table('festival_lections')} l 
                LEFT JOIN {$this->table('festival_spaces')} s ON s.id=l.space 
                WHERE l.festivalId=%d ORDER BY l.startTime ASC",
                [$festivalId]
            ),
            OBJECT
        );
        return $lections;
    }

    public function hp_lection_spaces_delete_callback()
    {
        $this->wpdb->delete(
            $this->table('festival_lections'),
            [
                'id' =>  $_POST['data']['id']
            ]
        );
        $lections = $this->getLections($_POST['data']['festivalId']);
        die(\json_encode($lections));
    }

    public function hp_lection_one_save_callback()
    {
        $data = [
            'festivalId' => $_POST['data']['festivalId'],
            'title' => wp_unslash($_POST['data']['title']),
            'startTime' => $_POST['data']['startTime'],
            'endTime' => $_POST['data']['endTime'],
            'lectorId' => $_POST['data']['lectorId'],
            'space' => $_POST['data']['space'],
            'zoom_url' => $_POST['data']['zoom_url']
        ];
        $id = $_POST['data']['id'] ?? 0;
        if ($id > 0) {
            $this->wpdb->update(
                $this->table('festival_lections'),
                $data,
                [
                    'id' => $id
                ]
            );
        } else {
            $this->wpdb->insert(
                $this->table('festival_lections'),
                $data
            );
        }
        $lections = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT l.*, s.title as space_name 
                FROM {$this->table('festival_lections')} l 
                LEFT JOIN {$this->table('festival_spaces')} s ON s.id=l.space 
                WHERE l.festivalId=%d ORDER BY l.startTime ASC",
                [$_POST['data']['festivalId']]
            ),
            OBJECT
        );
        die(\json_encode($lections));
    }

    //load festival password and spaces
    public function hp_lection_spaces_callback()
    {
        $spaces = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table('festival_spaces')} WHERE festivalId=%d",
                [$_POST['data']['id']]
            ),
            OBJECT
        );
        die(\json_encode(['spaces' => $spaces]));
    }

    private function getFestival($id)
    {
        $festivals = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table('festivals')} WHERE id=%d",
                [$id]
            ),
            OBJECT
        );
        return $festivals[0] ?? null;
    }

    public function hp_lection_spaces_save_callback()
    {
        $festivalId = $_POST['data']['festivalId'];
        $token = array_map("trim", explode("\n", $_POST['data']['token']));

        if ($festivalId == 0) {

            $this->wpdb->insert(
                $this->table('festivals'),
                [
                    'data' => \json_encode(
                        ['days' => [], 'token' => $token]
                    )
                ]
            );
            $festivalId = $this->wpdb->insert_id;
        } else {
            $fest = $this->getFestival($festivalId);
            $data = json_decode($fest->data);
            $data->token = $token;
            $this->wpdb->update(
                $this->table('festivals'),
                ['data' => json_encode($data)],
                [
                    'id' => $festivalId,
                ]
            );
        }



        foreach ($_POST['data']['spaces'] as $space) {

            $saveData = [
                'title' => $space['title'],
                'description' => $space['description'],
                'image' => $space['image'],
                'question' => $space['question'],
                'answer' => $space['answer'],
                'festivalId' => $festivalId,

            ];

            if (!isset($space['id'])) {
                $this->wpdb->insert(
                    $this->table('festival_spaces'),
                    $saveData
                );
            } else {
                $this->wpdb->update(
                    $this->table('festival_spaces'),
                    $saveData,
                    [
                        'id' => $space['id']
                    ]
                );
            }
        }
        $lections = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT l.*, s.title as space_name 
                FROM {$this->table('festival_lections')} l 
                LEFT JOIN {$this->table('festival_spaces')} s ON s.id=l.space 
                WHERE l.festivalId=%d ORDER BY l.startTime ASC",
                [$festivalId]
            ),
            OBJECT
        );
        $spaces = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table('festival_spaces')} WHERE festivalId=%d",
                [$festivalId]
            ),
            OBJECT
        );
        $lectors = $this->wpdb->get_results(
            "SELECT ID, post_title,post_status FROM {$this->table('posts')} WHERE post_type = 'team' AND post_status='publish'",
            OBJECT
        );
        die(\json_encode([
            'lections' => $lections,
            'spaces' => $spaces,
            'festivalId' => $festivalId,
            'lectors' => $lectors
        ]));
    }


    public function hp_lection_get_callback()
    {
        $festivals = $this->wpdb->get_results("SELECT * FROM {$this->table('festivals')} ORDER BY dateStart ASC", OBJECT);
        $response = [];
        foreach ($festivals as $festival) {

            $data = json_decode($festival->data);

            $days = [];

            foreach ($data->days as $day) {
                $days[] = [
                    'date' => $day->date,
                    'title' => $day->title
                ];
            }
            $response[] = [
                'id' => $festival->id,
                'dateStart' => $festival->dateStart,
                'dateEnd' => $festival->dateEnd,
                'days' => $days,
                'token' => $data->token
            ];
        }

        die(\json_encode($response));
    }


    public function hp_lection_delete_callback()
    {
        $this->wpdb->delete(
            $this->table('festivals'),
            [
                'id' =>  $_POST['data']['id'],
            ]
        );
        $this->wpdb->delete(
            $this->table('festival_spaces'),
            [
                'festivalId' =>  $_POST['data']['id']
            ]
        );
        $this->wpdb->delete(
            $this->table('festival_lections'),
            [
                'festivalId' =>  $_POST['data']['id']
            ]
        );
        die(\json_encode(['result' => "Deleted " . $_POST['data']['id']]));
    }

    public function hp_lection_save_callback()
    {
        $days = [];
        foreach ($_POST['data']['days'] as $day) {
            $days[] = ['date' => $day['date'], 'title' => wp_unslash($day['title'])];
        }
        $fest = $this->getFestival($_POST['data']['festivalId']);
        $jsonData = json_decode($fest->data);
        $jsonData->days = $days;
        $data = [
            'dateStart' => $_POST['data']['dateStart'],
            'dateEnd' => $_POST['data']['dateEnd'],
            'data' => \json_encode($jsonData)
        ];
        if (($_POST['data']['festivalId'] ?? 0) > 0) {
            $this->wpdb->update(
                $this->table('festivals'),
                $data,
                [
                    'id' => $_POST['data']['festivalId'],
                ]
            );
            die(\json_encode(['result' => true]));
        }
        die(\json_encode(['result' => false]));
    }



    public function add_menu_page()
    {
        add_menu_page(
            'Online Festivals',
            'Online Festivals',
            'manage_options',
            $this->get_id(),
            [&$this, 'load_view'],
            'dashicons-admin-page'
        );
    }

    //load data for festival program widget
    public function hp_program_festival_callback()
    {
        $responseToken = '';
        if (empty($_POST['token'] ?? '')) {
            $festivals = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT f.id,f.data FROM {$this->table('festivals')} f ORDER BY dateEnd ASC LIMIT 1",
                    []
                )
            );
        } else {
            $festivals = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT f.id,f.data 
                    FROM {$this->table('festivals')} f 
                    WHERE JSON_CONTAINS(JSON_EXTRACT(data, \"$.token\"),%s,'$')=1
                    ORDER BY dateStart ASC LIMIT 1",
                    ['"' . $_POST['token'] . '"']
                )
            );
            if (count($festivals) == 0) {
                die(json_encode(['error' => 'No Access', 'errorCode' => 404]));
            } else {
                $responseToken = $_POST['token'];
            }
        }


        $spaces = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table('festival_spaces')} WHERE festivalId=%s",
                [$festivals[0]->id]
            )
        );
        $lections = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT l.* 
                FROM {$this->table('festival_lections')} l        
                WHERE l.festivalId=%s  ",
                [$festivals[0]->id]
            )
        );
        for ($i = 0; $i < count($lections); $i++) {
            $lections[$i]->startTimeSeconds = strtotime($lections[$i]->startTime);
            $lections[$i]->endTimeSeconds = strtotime($lections[$i]->endTime);
        }
        $lectionsWithLector = array_filter($lections, fn($s) => !empty($s->lectorId ?? ''));
        $lectorIds = array_map(fn($s) => explode(",", $s->lectorId), $lectionsWithLector);
        $lectorIds = wpcf7_array_flatten($lectorIds);
        $sqlParts = [];
        $sqlParams = [];
        foreach ($lectorIds as $lectorId) {
            $sqlParts[] = '%d';
            $sqlParams[] = $lectorId;
        }
        $sqlParts = implode(",", $sqlParts);

        $lectors = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT ID, post_title,post_status 
                FROM {$this->table('posts')} 
                WHERE post_type = 'team' AND post_status='publish' 
                AND id IN ({$sqlParts})",
                $sqlParams
            ),
            OBJECT
        );
        $lectorsPerId = [];
        foreach ($lectors as $lector) {
            $lectorsPerId[$lector->ID] = $lector;
        }

        $data = json_decode($festivals[0]->data);
        for ($d = 0; $d < count($data->days); $d++) {
            $t = strtotime($data->days[$d]->date);
            $data->days[$d]->weekDay = date("w", $t);
            $data->days[$d]->month = date("M", $t);
            $data->days[$d]->day = date("j", $t);
        }
        die(json_encode([
            'days' => $data->days,
            'spaces' => $spaces,
            'lections' => $lections,
            'lectors' => $lectorsPerId,
            'responseToken' => $responseToken,
            'timenow' => time()
        ]));
    }

    //loading scripts of site part
    public function my_enqueue_site()
    {
        //client part
        $jsVersion = time();
        wp_enqueue_script('React', plugin_dir_url(__FILE__) . '/js/react.min.js');
        wp_enqueue_script('React-DOM',  plugin_dir_url(__FILE__) . '/js/react-dom.min.js');
        wp_enqueue_script('lectors', plugin_dir_url(__FILE__) . 'js/lectors.js?ver=' . $jsVersion);
        wp_enqueue_script('hd-lections', plugin_dir_url(__FILE__) . 'js/hd-lections.js?ver=' . $jsVersion);
        wp_enqueue_style('admin-custom', plugin_dir_url(__FILE__) . 'css/hd-lections-client.css?ver=' . $jsVersion);
        wp_enqueue_style('lectors', plugin_dir_url(__FILE__) . 'css/lectors.css?ver=' . $jsVersion);
        wp_localize_script('hd-lections', 'HD', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'plugin_url' => plugins_url('online-festival-scheduler'),
            'nonce' => wp_create_nonce('my-nonce'),
        ]);
    }

    //loading scripts for admin part
    public function my_enqueue_admin($hook)
    {

        if ('toplevel_page_hd-lections-admin-forms' !== $hook) {
            return;
        }
        $version = time();

        wp_enqueue_script('React', plugin_dir_url(__FILE__) . '/js/react.min.js');
        wp_enqueue_script('React-DOM',  plugin_dir_url(__FILE__) . '/js/react-dom.min.js');
        wp_enqueue_script('my_custom_script', plugin_dir_url(__FILE__) . 'js/hd-lections-admin.js?v=' . $version);
        wp_localize_script('my_custom_script', 'HD', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('my-nonce')

        ]);
        wp_enqueue_style('admin-custom', plugin_dir_url(__FILE__) . 'css/hd-lections-admin.css?v=' . $version);
    }

    //get plugin table names or specified table name if tableKey given
    private function table($tableKey = null)
    {
        if ($tableKey == null) {
            $tables = array_values($this->tables);
            for ($i = 0; $i < count($tables); $i++) {
                $tables[$i] = $this->wpdb->prefix . $tables[$i];
            }
            return $tables;
        } elseif (isset($this->tables[$tableKey])) {
            $tableName = $this->wpdb->prefix . $this->tables[$tableKey];
            return $tableName;
        } else {
            return $this->wpdb->prefix . $tableKey;
        }
    }

    //check if tables of plugin created
    private function check_if_tables_created()
    {
        $dbName = $this->wpdb->get_var(
            $this->wpdb->prepare("SELECT DATABASE()")
        );

        $tableNames = $this->table();
        $sql = "SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA='{$dbName}' AND TABLE_NAME IN ('" . implode("','", $tableNames) . "')";
        $tables = $this->wpdb->get_results(
            $this->wpdb->prepare($sql)
        );
        return count($tables) == 3;
    }

    //template of admin part
    public function load_view()
    {
        $tableExists = $this->check_if_tables_created();

        echo '<div class="ct-admin-forms ' . $this->current_page . '">';
        echo '<div class="container container1">';
        echo '<div class="inner">';
        echo '<h1>Online Festivals</h1>';
        echo '<div id="js-hd-festival-form" data-status="' . $tableExists . '"></div>';
        echo '</div>';
        echo '</div>';
        echo '</div> <!-- / ct-admin-forms -->';
    }

    public function get_id()
    {
        return self::ID;
    }
}

new OnlineFestivalScheduler($wpdb);
