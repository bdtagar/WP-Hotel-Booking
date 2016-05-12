<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit();
}

class HBWPML_Support {

	/* sitepress object */
	public $sitepress = null;

	/* default language wpml setuped */
	public $default_language_code = null;

	/* wpml current language code */
	public $current_language_code = null;

	function __construct() {
		/* sitepress */
		global $sitepress;

		/* sitepress object instance */
		$this->sitepress = $sitepress;

		/* default language setup */
		$this->default_language_code = $this->sitepress->get_default_language();

		$this->current_language_code = defined( 'ICL_LANGUAGE_CODE' ) ? ICL_LANGUAGE_CODE : null;

		/* filter dropdown rooms */
		add_filter( 'hotel_booking_rooms_dropdown', array( $this, 'hotel_booking_rooms_dropdown' ) );
		/* compare current language and default language */
		if ( $this->current_language_code === $this->default_language_code ) {
			return;
		}

		add_action( 'init', array( $this, 'init') );

		/* disable change some room attributes in other post languages */
		add_filter( 'hb_metabox_room_settings', array( $this, 'disable_change_room_attributes' ) );

		/* disable change some coupon attributes in other post languages */
		add_filter( 'hb_metabox_coupon_settings', array( $this, 'disable_change_coupon_attributes' ) );

		/* capacity */
		add_filter( 'manage_hb_room_capacity_custom_column', array( $this, 'hotel_booking_capacity_order_attr' ), 20, 3 );

	}

	public function init() {
		// var_dump( ICL_LANGUAGE_CODE, $this->get_object_default_language(18) ); die();
	}

	/* get default post_id, capacity, room_type by origin post_ID || term_ID */
	public function get_object_default_language( $id = null, $type = 'hb_room' ) {
		if ( ! $id ) {
			return;
		}

		return icl_object_id( $id, $type, false, $this->default_language_code );
	}

	/**
	 * disable_change_room_attributes disable some attributes of room setting in other language post
	 * @param  $fields array
	 * @return $fields array
	 */
	public function disable_change_room_attributes( $fields ) {

		foreach ( $fields as $k => $field ) {
			if ( in_array( $field['name'], array( 'num_of_rooms', 'room_capacity', 'max_child_per_room' ) ) )
			$fields[$k][ 'attr' ]['disabled'] = 'disabled';
		}
		return $fields;
	}

	/**
	 * disable_change_coupon_attributes disable some attributes of coupon setting in other language post
	 * @param  $fields array
	 * @return $fields array
	 */
	public function disable_change_coupon_attributes( $fields ) {
		foreach ( $fields as $k => $field ) {
			if ( $field['name'] !== 'coupon_description' ) {
				$fields[$k][ 'attr' ]['disabled'] = 'disabled';
			}
		}
		return $fields;
	}

	/* filter dropdown rooms */
	public function hotel_booking_rooms_dropdown( $posts ) {

		$rooms = array();
		foreach ( $posts as $post ) {
			$id = $post->ID;
			$room_id = $this->get_object_default_language( $id );
			if ( $room_id && ! isset( $rooms[ $room_id ] ) ) {
				$rooms[ $room_id ] = get_post( $room_id );
			}
		}

		return $rooms;
	}

	/* capacity ordering */
	public function hotel_booking_capacity_order_attr( $content, $column_name, $term_id ) {
		$taxonomy = sanitize_text_field( $_REQUEST['taxonomy'] );
        $term = get_term( $term_id, $taxonomy );
        switch ($column_name) {
            case 'ordering':
                $attr = '';
                $content = sprintf( '<input class="hb-number-field" type="number" name="%s_ordering[%d]" value="%d" size="3" %s />', $taxonomy, $term_id, $term->term_group, '' );
                break;
            case 'capacity':
                $capacity = get_term_meta( $term_id, 'hb_max_number_of_adults', true );
                $content = '<input class="hb-number-field" type="number" name="' . $taxonomy . '_capacity[' . $term_id . ']" value="' . $capacity .'" size="2" />';
                break;
            default:
                break;
        }

        return $content;
	}

}

new HBWPML_Support();